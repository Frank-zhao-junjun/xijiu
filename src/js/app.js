/**
 * app.js — 主应用逻辑
 * 处理路由、实时数据刷新、交互事件
 */

/* ---- 页面路由 ---- */
const PAGE_TITLES = {
  dashboard: '总览看板',
  iot: '物联网感知',
  logistics: '智慧物流',
  planning: '园区规划',
  operations: '运维管理'
};

function navigateTo(pageId) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // 显示目标页面
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.remove('hidden');

  // 高亮导航项
  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');

  // 更新页面标题
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[pageId] || pageId;

  // 页面切换后重绘图表（解决 canvas 尺寸问题）
  setTimeout(() => {
    initCharts();
    if (pageId === 'iot') refreshIotSensors();
  }, 50);

  // 移动端自动关闭侧边栏
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

/* ---- 导航事件绑定 ---- */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const pageId = item.dataset.page;
    if (pageId) navigateTo(pageId);
  });
});

/* ---- 移动端菜单 ---- */
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ---- 实时时钟 ---- */
function updateClock() {
  const now = new Date();
  const str = now.toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short'
  }) + ' ' + now.toLocaleTimeString('zh-CN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const el = document.getElementById('datetime');
  if (el) el.textContent = str;
}

setInterval(updateClock, 1000);
updateClock();

/* ---- KPI 实时刷新（模拟） ---- */
function refreshKpis() {
  const kpiTemp = document.getElementById('kpi-temp');
  if (kpiTemp) {
    const t = (22 + Math.random() * 3).toFixed(1);
    kpiTemp.textContent = t + '°C';
  }

  const kpiHumidity = document.getElementById('kpi-humidity');
  if (kpiHumidity) {
    const h = Math.round(65 + Math.random() * 8);
    kpiHumidity.textContent = h + '%';
  }

  const kpiVehicles = document.getElementById('kpi-vehicles');
  if (kpiVehicles) {
    const v = Math.round(80 + Math.random() * 15);
    kpiVehicles.textContent = v + ' 辆';
  }
}

setInterval(refreshKpis, 5000);

/* ---- 物流时间线追加新条目（模拟） ---- */
const vehicleNumbers = ['苏A·33333', '苏E·22222', '苏F·44444', '苏G·55555'];
const taskTypes = [
  { text: '原料入库', type: 'in' },
  { text: '成品出库', type: 'out' },
  { text: '空瓶回收', type: 'out' },
  { text: '辅料入库', type: 'in' }
];

function addLogisticsEntry() {
  const timeline = document.getElementById('logistics-timeline');
  if (!timeline) return;

  const vehicle = vehicleNumbers[Math.floor(Math.random() * vehicleNumbers.length)];
  const task = taskTypes[Math.floor(Math.random() * taskTypes.length)];
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  const item = document.createElement('div');
  item.className = 'timeline-item';
  item.innerHTML = `
    <span class="timeline-dot ${task.type}"></span>
    <div class="timeline-content">
      <div class="timeline-title">${task.text} — ${vehicle}</div>
      <div class="timeline-time">${timeStr}</div>
    </div>
  `;

  // 插入到顶部
  timeline.insertBefore(item, timeline.firstChild);

  // 保持最多 6 条
  while (timeline.children.length > 6) {
    timeline.removeChild(timeline.lastChild);
  }
}

setInterval(addLogisticsEntry, 12000);

/* ---- 告警处理 ---- */
function handleAlert(btn) {
  const item = btn.closest('.alert-item');
  if (!item) return;

  item.classList.remove('warning', 'critical');
  item.classList.add('info', 'resolved');

  const icon = item.querySelector('.alert-icon');
  if (icon) icon.textContent = '✅';

  const titleEl = item.querySelector('.alert-title');
  if (titleEl && !titleEl.textContent.includes('已解决')) {
    titleEl.textContent += ' (已解决)';
  }

  btn.replaceWith((() => {
    const tag = document.createElement('span');
    tag.className = 'resolved-tag';
    tag.textContent = '已处理';
    return tag;
  })());

  // 更新 KPI 告警数
  const kpiAlerts = document.getElementById('kpi-alerts');
  if (kpiAlerts) {
    const current = parseInt(kpiAlerts.textContent) || 0;
    if (current > 0) {
      kpiAlerts.textContent = (current - 1) + ' 条';
      if (current - 1 === 0) {
        kpiAlerts.classList.remove('warning');
      }
    }
  }
}

/* ---- 工单弹窗 ---- */
let workOrderCounter = 22;

function createWorkOrder() {
  document.getElementById('workorder-modal').classList.remove('hidden');
  document.getElementById('wo-device').value = '';
  document.getElementById('wo-desc').value = '';
}

function closeModal() {
  document.getElementById('workorder-modal').classList.add('hidden');
}

function submitWorkOrder() {
  const device = document.getElementById('wo-device').value.trim();
  const desc = document.getElementById('wo-desc').value.trim();
  const person = document.getElementById('wo-person').value;
  const priority = document.getElementById('wo-priority').value;

  if (!device || !desc) {
    alert('请填写设备名称和故障描述');
    return;
  }

  workOrderCounter++;
  const woNum = 'WO-2024-00' + workOrderCounter;

  const tbody = document.querySelector('#page-operations .data-table tbody');
  if (tbody) {
    const priorityClass = priority === '特急' ? 'critical' : priority === '紧急' ? 'warning' : '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${woNum}</td>
      <td>${device}</td>
      <td>${desc}${priorityClass ? ` <span style="color:var(--error);font-size:11px">[${priority}]</span>` : ''}</td>
      <td>${person}</td>
      <td><span class="status-badge-sm waiting">待处理</span></td>
    `;
    tbody.insertBefore(row, tbody.firstChild);
  }

  closeModal();
}

/* ---- 键盘 ESC 关闭弹窗 ---- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ---- 初始化 ---- */
window.addEventListener('load', () => {
  navigateTo('dashboard');
  setTimeout(refreshIotSensors, 100);
  // IoT 数据每隔 8 秒刷新
  setInterval(refreshIotSensors, 8000);
});

window.addEventListener('resize', () => {
  const activePage = document.querySelector('.nav-item.active');
  if (activePage) {
    const pageId = activePage.dataset.page;
    if (['dashboard', 'iot', 'logistics', 'operations'].includes(pageId)) {
      initCharts();
    }
  }
});
