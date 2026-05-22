const video = document.getElementById('video');
const camPlaceholder = document.getElementById('camPlaceholder');
const historyTable = document.getElementById('historyTable');
const codeReader = new ZXing.BrowserMultiFormatReader();
 
let sttCounter = 1;
let scanning = false;
 
const modelDescriptions = {
  "TP48-I-NDI": "Thiết bị chống sét MTL TP48-I-NDI",
  "SD32X":      "Thiết bị chống sét MTL SD32X",
  "SD32T3":     "Thiết bị chống sét MTL SD32T3",
  "SLP32D":     "Thiết bị chống sét MTL SLP32D",
  "MTL7728+":   "Module tín hiệu MTL7728+",
  "MTL5541":    "Module tín hiệu MTL5541",
  "MTL5532":    "Module tín hiệu MTL5532",
  "MTL5531":    "Module tín hiệu MTL5531",
  "ZB24567":    "Thiết bị chống sét MTL ZB24567"
};
 
/* ─── Tiện ích ──────────────────────────────────────────── */
 
function getCurrentDateTime() {
  const now = new Date();
  return {
    date: now.toLocaleDateString('vi-VN'),
    time: now.toLocaleTimeString('vi-VN')
  };
}
 
function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}
 
function vibrateDevice() {
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}
 
/* ─── Camera ────────────────────────────────────────────── */
 
function showCamera() {
  video.style.display = 'block';
  camPlaceholder.style.display = 'none';
}
 
function hideCamera() {
  video.style.display = 'none';
  camPlaceholder.style.display = 'block';
}
 
function stopScanning() {
  codeReader.reset();
  video.srcObject = null;
  scanning = false;
  hideCamera();
}
 
// Đặt nút về trạng thái "Scan"
function resetScanButton(btn) {
  btn.disabled = false;
  btn.innerHTML = '<span class="glyphicon glyphicon-camera"></span> Scan serial';
  btn.classList.remove('btn-warning');
  btn.classList.add('btn-success');
}
 
// Đặt nút về trạng thái "Đang quét..."
function setScanning(btn) {
  btn.innerHTML = '<span class="glyphicon glyphicon-stop"></span> Dừng quét';
  btn.classList.remove('btn-success');
  btn.classList.add('btn-warning');
}
 
async function scanToInput(targetInput, button) {
  // Nếu đang quét → dừng lại
  if (scanning) {
    stopScanning();
    resetScanButton(button);
    return;
  }
 
  stopScanning();
  targetInput.value = "";
  scanning = true;
  setScanning(button);
  showCamera();
 
  try {
    codeReader.decodeFromVideoDevice(null, video, (result, err) => {
      if (result) {
        targetInput.value = result.getText();
        console.log("✅ Đã quét:", result.getText());
        playBeep();
        vibrateDevice();
        stopScanning();
        resetScanButton(button);
      }
      if (err && !(err instanceof ZXing.NotFoundException)) {
        console.error("❌ Lỗi khi quét:", err);
      }
    });
  } catch (error) {
    console.error("❌ Lỗi truy cập camera:", error);
    alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    stopScanning();
    resetScanButton(button);
  }
}
 
/* ─── Google Form ───────────────────────────────────────── */
 
function sendToGoogleForm(po, model, description, serial, date, time) {
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfv2eU5P0e8qFU42ORx9FFshzqIC-_XVzViDnhw4fqV6bOGzg/formResponse";
  const formData = new FormData();
  formData.append("entry.2005620554", po);
  formData.append("entry.1045781291", model);
  formData.append("entry.1705309289", description);
  formData.append("entry.1166974658", date);
  formData.append("entry.1065046570", time);
  formData.append("entry.839337160",  serial);
 
  fetch(formURL, { method: "POST", mode: "no-cors", body: formData })
    .then(() => console.log("✅ Đã gửi dữ liệu lên Google Form"))
    .catch(err => console.error("❌ Lỗi gửi dữ liệu:", err));
}
 
/* ─── Bảng lịch sử ──────────────────────────────────────── */
 
function saveToTable(po, model, description, serial, date, time) {
  // Xóa row "Chưa có dữ liệu" ở lần lưu đầu tiên
  if (sttCounter === 1) {
    historyTable.innerHTML = "";
  }
 
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${sttCounter++}</td>
    <td>${po}</td>
    <td>${model}</td>
    <td>${description}</td>
    <td>${serial}</td>
    <td>${date}</td>
    <td>${time}</td>
  `;
  historyTable.appendChild(row);
}
 
/* ─── Khởi động ─────────────────────────────────────────── */
 
window.addEventListener("load", () => {
  const poInput          = document.querySelector(".poInput");
  const modelInput       = document.querySelector(".modelInput");
  const descriptionInput = document.querySelector(".descriptionInput");
  const serialInput      = document.querySelector(".serialInput");
  const scanBtn          = document.querySelector(".scanSerial");
  const saveBtn          = document.querySelector(".saveBtn");
 
  // Tự động điền mô tả khi chọn model
  modelInput.addEventListener("input", () => {
    const model = modelInput.value.trim();
    descriptionInput.value = modelDescriptions[model] || "";
  });
 
  // Nút Scan
  scanBtn.addEventListener("click", function () {
    scanToInput(serialInput, this);
  });
 
  // Nút Lưu
  saveBtn.addEventListener("click", () => {
    const po          = poInput.value.trim();
    const model       = modelInput.value.trim();
    const description = descriptionInput.value.trim();
    const serial      = serialInput.value.trim();
 
    if (!po || !model || !serial) {
      alert("Vui lòng nhập đầy đủ: Số PO, Model và Serial trước khi lưu.");
      return;
    }
 
    const { date, time } = getCurrentDateTime();
    sendToGoogleForm(po, model, description, serial, date, time);
    saveToTable(po, model, description, serial, date, time);
 
    // Dừng camera và reset serial để quét tiếp
    stopScanning();
    resetScanButton(scanBtn);
    serialInput.value = "";
  });
});
 
// Dừng camera khi chuyển tab
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopScanning();
    resetScanButton(document.querySelector(".scanSerial"));
  }
});
