/**
 * iot.js — 物联网传感器数据模块
 * 初始化并定期刷新传感器卡片数据
 */

const IOT_ZONES = ['酿造一车间', '酿造二车间', '蒸馏车间', '窖池区', '成品仓 A', '成品仓 B', '物流区'];

function randomInRange(min, max, decimals = 1) {
  const v = min + Math.random() * (max - min);
  return parseFloat(v.toFixed(decimals));
}

function sensorStatus(value, warnLow, warnHigh, critHigh) {
  if (value >= critHigh || value < warnLow) return 'error';
  if (value >= warnHigh) return 'warn';
  return 'ok';
}

function buildTempSensors() {
  return IOT_ZONES.map(zone => {
    const base = zone.includes('窖') ? 27 : zone.includes('成品') ? 19 : 23;
    const value = randomInRange(base - 1.5, base + 2.5);
    const status = sensorStatus(value, 15, 26, 30);
    return { zone, value: value + '°C', status };
  });
}

function buildHumiditySensors() {
  return IOT_ZONES.map(zone => {
    const value = randomInRange(55, 80, 0);
    const status = sensorStatus(value, 40, 75, 85);
    return { zone, value: value + '%', status };
  });
}

function buildAlcoholSensors() {
  const ferZones = ['酿造一车间', '酿造二车间', '蒸馏车间', '窖池区'];
  return ferZones.map(zone => {
    const value = randomInRange(0.5, 4.5, 2);
    const status = sensorStatus(value, 0, 3.5, 4.5);
    return { zone, value: value + '%', status };
  });
}

function buildFireSensors() {
  const allZones = [...IOT_ZONES, '办公区', '配电室'];
  return allZones.map(zone => {
    const rand = Math.random();
    const status = rand > 0.95 ? 'warn' : 'ok';
    return { zone, value: status === 'ok' ? '正常' : '烟感触发', status };
  });
}

function renderSensorGrid(containerId, sensors) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = '';
  sensors.forEach(s => {
    const card = document.createElement('div');
    card.className = 'sensor-card' + (s.status !== 'ok' ? ' ' + s.status : '');

    const zone = document.createElement('div');
    zone.className = 'sensor-zone';
    zone.textContent = s.zone;

    const value = document.createElement('div');
    value.className = 'sensor-value';
    value.textContent = s.value;

    const status = document.createElement('div');
    status.className = 'sensor-status';
    status.textContent = s.status === 'ok' ? '● 正常' : s.status === 'warn' ? '▲ 注意' : '✕ 异常';

    card.append(zone, value, status);
    container.appendChild(card);
  });
}

function refreshIotSensors() {
  renderSensorGrid('temp-sensors', buildTempSensors());
  renderSensorGrid('humidity-sensors', buildHumiditySensors());
  renderSensorGrid('alcohol-sensors', buildAlcoholSensors());
  renderSensorGrid('fire-sensors', buildFireSensors());
}
