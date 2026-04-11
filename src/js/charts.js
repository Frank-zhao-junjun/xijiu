/**
 * charts.js — 图表绘制模块
 * 使用原生 Canvas API 绘制折线图和饼图
 */

/* ---- 工具函数 ---- */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function resizeCanvas(canvas) {
  const parent = canvas.parentElement;
  const ratio = window.devicePixelRatio || 1;
  const w = parent.clientWidth;
  const h = 220;
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  return { ctx, w, h };
}

/* ---- 折线图 ---- */
function drawLineChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const { ctx, w, h } = resizeCanvas(canvas);

  const PAD = { top: 20, right: 20, bottom: 36, left: 50 };
  const chartW = w - PAD.left - PAD.right;
  const chartH = h - PAD.top - PAD.bottom;

  // 背景
  ctx.fillStyle = '#161b22';
  ctx.fillRect(0, 0, w, h);

  // 计算 Y 轴范围
  const allValues = datasets.flatMap(d => d.data);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const yPad = range * 0.15;
  const yMin = minVal - yPad;
  const yMax = maxVal + yPad;

  function xPos(i) {
    return PAD.left + (i / (labels.length - 1)) * chartW;
  }
  function yPos(v) {
    return PAD.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH;
  }

  // 网格线
  const gridLines = 5;
  ctx.strokeStyle = 'rgba(48,54,61,0.7)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridLines; i++) {
    const y = PAD.top + (i / gridLines) * chartH;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + chartW, y);
    ctx.stroke();

    const val = yMax - (i / gridLines) * (yMax - yMin);
    ctx.fillStyle = '#6e7681';
    ctx.font = '11px PingFang SC, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(val), PAD.left - 6, y + 4);
  }

  // X 轴标签
  ctx.fillStyle = '#6e7681';
  ctx.font = '11px PingFang SC, sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((label, i) => {
    ctx.fillText(label, xPos(i), h - PAD.bottom + 18);
  });

  // 数据系列
  datasets.forEach(ds => {
    const rgb = hexToRgb(ds.color);

    // 渐变填充
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
    grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.25)`);
    grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(ds.data[0]));
    ds.data.forEach((v, i) => {
      if (i === 0) return;
      const xc = (xPos(i - 1) + xPos(i)) / 2;
      ctx.bezierCurveTo(xc, yPos(ds.data[i - 1]), xc, yPos(v), xPos(i), yPos(v));
    });
    ctx.lineTo(xPos(ds.data.length - 1), PAD.top + chartH);
    ctx.lineTo(xPos(0), PAD.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 折线
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(ds.data[0]));
    ds.data.forEach((v, i) => {
      if (i === 0) return;
      const xc = (xPos(i - 1) + xPos(i)) / 2;
      ctx.bezierCurveTo(xc, yPos(ds.data[i - 1]), xc, yPos(v), xPos(i), yPos(v));
    });
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 数据点
    ds.data.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(xPos(i), yPos(v), 4, 0, Math.PI * 2);
      ctx.fillStyle = ds.color;
      ctx.fill();
      ctx.strokeStyle = '#161b22';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  });

  // 图例
  let legendX = PAD.left;
  datasets.forEach(ds => {
    ctx.fillStyle = ds.color;
    ctx.fillRect(legendX, 4, 14, 6);
    ctx.fillStyle = '#8b949e';
    ctx.font = '11px PingFang SC, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ds.label, legendX + 18, 12);
    legendX += ctx.measureText(ds.label).width + 40;
  });
}

/* ---- 饼图 ---- */
function drawPieChart(canvasId, segments) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const { ctx, w, h } = resizeCanvas(canvas);

  ctx.fillStyle = '#161b22';
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.38;
  const cy = h / 2;
  const r = Math.max(10, Math.min(h, w * 0.55) / 2 - 10);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let startAngle = -Math.PI / 2;

  segments.forEach(seg => {
    const angle = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = '#161b22';
    ctx.lineWidth = 2;
    ctx.stroke();

    startAngle += angle;
  });

  // 中心镂空
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#161b22';
  ctx.fill();

  // 图例
  const legendX = w * 0.62;
  let legendY = (h - segments.length * 26) / 2 + 10;
  ctx.font = '12px PingFang SC, sans-serif';
  segments.forEach(seg => {
    ctx.fillStyle = seg.color;
    ctx.beginPath();
    ctx.arc(legendX + 6, legendY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e6edf3';
    ctx.textAlign = 'left';
    ctx.fillText(seg.label, legendX + 16, legendY + 4);

    ctx.fillStyle = '#8b949e';
    ctx.textAlign = 'right';
    ctx.fillText(
      ((seg.value / total) * 100).toFixed(1) + '%',
      w - 12,
      legendY + 4
    );
    legendY += 26;
  });
}

/* ---- 柱状图 ---- */
function drawBarChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const { ctx, w, h } = resizeCanvas(canvas);

  const PAD = { top: 20, right: 20, bottom: 36, left: 50 };
  const chartW = w - PAD.left - PAD.right;
  const chartH = h - PAD.top - PAD.bottom;

  ctx.fillStyle = '#161b22';
  ctx.fillRect(0, 0, w, h);

  const allValues = datasets.flatMap(d => d.data);
  const maxVal = Math.max(...allValues);
  const yMax = maxVal * 1.2;

  function yPos(v) {
    return PAD.top + chartH - (v / yMax) * chartH;
  }

  // Grid
  const gridLines = 5;
  ctx.strokeStyle = 'rgba(48,54,61,0.7)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridLines; i++) {
    const y = PAD.top + (i / gridLines) * chartH;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + chartW, y);
    ctx.stroke();

    const val = yMax - (i / gridLines) * yMax;
    ctx.fillStyle = '#6e7681';
    ctx.font = '11px PingFang SC, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(val), PAD.left - 6, y + 4);
  }

  const groupCount = labels.length;
  const dsCount = datasets.length;
  const groupW = chartW / groupCount;
  const barW = (groupW * 0.7) / dsCount;
  const groupGap = groupW * 0.3;

  datasets.forEach((ds, di) => {
    labels.forEach((label, i) => {
      const x = PAD.left + i * groupW + groupGap / 2 + di * barW;
      const y = yPos(ds.data[i]);
      const bh = PAD.top + chartH - y;

      const rgb = hexToRgb(ds.color);
      const grad = ctx.createLinearGradient(0, y, 0, y + bh);
      grad.addColorStop(0, ds.color);
      grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW - 2, bh, [3, 3, 0, 0]);
      ctx.fill();
    });
  });

  // X 轴标签
  ctx.fillStyle = '#6e7681';
  ctx.font = '11px PingFang SC, sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((label, i) => {
    ctx.fillText(label, PAD.left + i * groupW + groupW / 2, h - PAD.bottom + 18);
  });

  // 图例
  let lx = PAD.left;
  datasets.forEach(ds => {
    ctx.fillStyle = ds.color;
    ctx.fillRect(lx, 4, 14, 6);
    ctx.fillStyle = '#8b949e';
    ctx.font = '11px PingFang SC, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ds.label, lx + 18, 12);
    lx += ctx.measureText(ds.label).width + 40;
  });
}

/* ---- 初始化所有图表 ---- */
function initCharts() {
  const days = ['12/5', '12/6', '12/7', '12/8', '12/9', '12/10', '12/11'];

  // 生产趋势折线图
  drawLineChart('productionChart', days, [
    {
      label: '酿造产量(吨)',
      color: '#c8a84b',
      data: [42, 45, 40, 48, 52, 49, 55]
    },
    {
      label: '出库量(吨)',
      color: '#58a6ff',
      data: [30, 35, 28, 38, 40, 42, 38]
    }
  ]);

  // 能耗饼图
  drawPieChart('energyPieChart', [
    { label: '生产区', value: 45, color: '#c8a84b' },
    { label: '仓储区', value: 20, color: '#58a6ff' },
    { label: '物流区', value: 18, color: '#3fb950' },
    { label: '办公区', value: 10, color: '#bc80f0' },
    { label: '其他', value: 7, color: '#6e7681' }
  ]);

  // IoT 温度趋势折线图
  const hours = ['06:00','08:00','10:00','12:00','14:00','16:00','18:00'];
  drawLineChart('iotTrendChart', hours, [
    {
      label: '发酵车间(°C)',
      color: '#c8a84b',
      data: [22.1, 22.8, 23.4, 24.1, 24.5, 23.9, 23.2]
    },
    {
      label: '仓储区(°C)',
      color: '#58a6ff',
      data: [18.5, 18.8, 19.2, 19.8, 20.1, 19.7, 19.3]
    },
    {
      label: '窖池区(°C)',
      color: '#3fb950',
      data: [26.0, 26.3, 27.1, 28.3, 28.9, 28.2, 27.5]
    }
  ]);

  // 物流吞吐量柱状图
  drawBarChart('logisticsChart', days, [
    {
      label: '入库(件)',
      color: '#3fb950',
      data: [120, 145, 110, 160, 175, 150, 165]
    },
    {
      label: '出库(件)',
      color: '#58a6ff',
      data: [95, 120, 90, 140, 155, 130, 148]
    }
  ]);

  // 设备健康度饼图
  drawPieChart('healthChart', [
    { label: '健康', value: 305, color: '#3fb950' },
    { label: '维修中', value: 8, color: '#d29922' },
    { label: '待检修', value: 5, color: '#f85149' }
  ]);
}
