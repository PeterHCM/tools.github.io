/*
 * Quét mã sản phẩm: quét serial bằng camera (ZXing), lưu lên Google Form.
 * File phụ thuộc: vtl_index.min.js (thư viện ZXing).
 */
(function () {
	"use strict";

	var GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfv2eU5P0e8qFU42ORx9FFshzqIC-_XVzViDnhw4fqV6bOGzg/formResponse";
	var FORM_FIELDS = {
		po: "entry.2005620554",
		model: "entry.1045781291",
		description: "entry.1705309289",
		date: "entry.1166974658",
		time: "entry.1065046570",
		serial: "entry.839337160"
	};

	// Thêm model mới chỉ cần thêm 1 dòng ở đây (danh sách gợi ý sẽ tự cập nhật)
	var MODELS = {
		"TP48-I-NDI": "Thiết bị chống sét MTL TP48-I-NDI",
		"SD32X": "Thiết bị chống sét MTL SD32X",
		"SD32T3": "Thiết bị chống sét MTL SD32T3",
		"SLP32D": "Thiết bị chống sét MTL SLP32D",
		"MTL7728+": "Module tín hiệu MTL7728+",
		"MTL5541": "Module tín hiệu MTL5541",
		"MTL5532": "Module tín hiệu MTL5532",
		"MTL5531": "Module tín hiệu MTL5531",
		"ZB24567": "Thiết bị chống sét MTL ZB24567"
	};

	var video = document.getElementById("video");
	var camPlaceholder = document.getElementById("camPlaceholder");
	var historyTable = document.getElementById("historyTable");
	var poInput = document.getElementById("poInput");
	var modelInput = document.getElementById("modelInput");
	var descriptionInput = document.getElementById("descriptionInput");
	var serialInput = document.getElementById("serialInput");
	var scanBtn = document.getElementById("scanBtn");
	var form = document.getElementById("scanForm");

	var codeReader = new ZXing.BrowserMultiFormatReader();
	var scanning = false;
	var rowCount = 0;
	var audioCtx = null;

	/* ---------- Tiện ích ---------- */

	function escapeHtml(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
		});
	}

	function now() {
		var d = new Date();
		return { date: d.toLocaleDateString("vi-VN"), time: d.toLocaleTimeString("vi-VN") };
	}

	// Dùng lại 1 AudioContext (trình duyệt giới hạn số lượng được tạo)
	function beep() {
		try {
			audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
			var osc = audioCtx.createOscillator();
			osc.type = "square";
			osc.frequency.value = 800;
			osc.connect(audioCtx.destination);
			osc.start();
			osc.stop(audioCtx.currentTime + 0.15);
		} catch (e) { /* không có âm thanh cũng không sao */ }
		if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
	}

	/* ---------- Camera ---------- */

	function setScanButton(isScanning) {
		scanBtn.innerHTML = isScanning
			? '<i class="fa fa-stop"></i> Dừng'
			: '<i class="fa fa-camera"></i> Quét';
		scanBtn.classList.toggle("btn-dark", !isScanning);
		scanBtn.classList.toggle("btn-warning", isScanning);
	}

	function stopScanning() {
		codeReader.reset();
		scanning = false;
		video.style.display = "none";
		camPlaceholder.style.display = "";
		setScanButton(false);
	}

	function startScanning() {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			alert("Trình duyệt không hỗ trợ camera (cần mở trang bằng https).");
			return;
		}
		scanning = true;
		setScanButton(true);
		video.style.display = "block";
		camPlaceholder.style.display = "none";

		// Ưu tiên camera sau trên điện thoại
		var constraints = { video: { facingMode: { ideal: "environment" } } };
		codeReader.decodeFromConstraints(constraints, video, function (result, err) {
			if (result) {
				serialInput.value = result.getText();
				beep();
				stopScanning();
				serialInput.focus();
			} else if (err && !(err instanceof ZXing.NotFoundException)) {
				console.warn("Lỗi khi quét:", err);
			}
		}).catch(function (error) {
			console.error("Lỗi truy cập camera:", error);
			alert("Không thể truy cập camera. Vui lòng cấp quyền camera cho trang này.");
			stopScanning();
		});
	}

	/* ---------- Lưu dữ liệu ---------- */

	function sendToGoogleForm(rec) {
		var body = new FormData();
		Object.keys(FORM_FIELDS).forEach(function (k) { body.append(FORM_FIELDS[k], rec[k]); });
		// no-cors: không đọc được phản hồi, chỉ biết là đã gửi đi (hoặc lỗi mạng)
		return fetch(GOOGLE_FORM_URL, { method: "POST", mode: "no-cors", body: body });
	}

	function addRow(rec) {
		if (rowCount === 0) historyTable.innerHTML = "";
		rowCount++;
		var tr = document.createElement("tr");
		tr.innerHTML =
			"<td>" + rowCount + "</td>" +
			"<td>" + escapeHtml(rec.po) + "</td>" +
			"<td>" + escapeHtml(rec.model) + "</td>" +
			"<td>" + escapeHtml(rec.description) + "</td>" +
			"<td><strong>" + escapeHtml(rec.serial) + "</strong></td>" +
			"<td>" + rec.date + "</td>" +
			"<td>" + rec.time + "</td>" +
			'<td class="status"><i class="fa fa-spinner fa-spin"></i></td>';
		historyTable.insertBefore(tr, historyTable.firstChild); // mới nhất lên đầu
		return tr.querySelector(".status");
	}

	function isDuplicate(serial) {
		return Array.prototype.some.call(historyTable.querySelectorAll("tr td:nth-child(5)"), function (td) {
			return td.textContent === serial;
		});
	}

	function save(e) {
		e.preventDefault();
		var rec = {
			po: poInput.value.trim(),
			model: modelInput.value.trim(),
			description: descriptionInput.value.trim(),
			serial: serialInput.value.trim()
		};
		if (!rec.po || !rec.model || !rec.serial) {
			alert("Vui lòng nhập đầy đủ: Số PO, Model và Serial trước khi lưu.");
			return;
		}
		if (isDuplicate(rec.serial) && !confirm("Serial " + rec.serial + " đã lưu trong phiên này. Vẫn lưu tiếp?")) {
			return;
		}
		var t = now();
		rec.date = t.date;
		rec.time = t.time;

		var statusCell = addRow(rec);
		sendToGoogleForm(rec)
			.then(function () {
				statusCell.innerHTML = '<span class="text-success"><i class="fa fa-check"></i> Đã gửi</span>';
			})
			.catch(function (err) {
				console.error("Lỗi gửi dữ liệu:", err);
				statusCell.innerHTML = '<span class="text-danger"><i class="fa fa-times"></i> Lỗi mạng</span>';
			});

		stopScanning();
		serialInput.value = "";
		serialInput.focus();
	}

	/* ---------- Khởi động ---------- */

	document.getElementById("modelList").innerHTML = Object.keys(MODELS).map(function (m) {
		return '<option value="' + escapeHtml(m) + '">';
	}).join("");

	modelInput.addEventListener("input", function () {
		var desc = MODELS[modelInput.value.trim()];
		if (desc) descriptionInput.value = desc;
	});

	scanBtn.addEventListener("click", function () {
		if (scanning) stopScanning(); else startScanning();
	});

	form.addEventListener("submit", save);

	// Tắt camera khi chuyển tab / khoá màn hình
	document.addEventListener("visibilitychange", function () {
		if (document.hidden && scanning) stopScanning();
	});
})();
