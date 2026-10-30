/*
 * Danh thiếp nhân viên.
 *  - namecards.html?name=tuan  -> nạp vcf/tuan.vcf, ẩn form (chỉ cho lưu danh bạ / tải ảnh)
 *  - namecards.html            -> nạp vcf/default.vcf, cho phép sửa thông tin
 * File phụ thuộc: jQuery, vtl_layout.js (VTL_STAFF), QRCodeStyling, QRCode, html2canvas.
 */
(function () {
	"use strict";

	var STAFF_KEYS = (window.VTL_STAFF || []).map(function (s) { return s.key; });
	var params = new URLSearchParams(window.location.search);
	var personKey = (params.get("name") || "").trim().toLowerCase();
	var isStaffCard = STAFF_KEYS.indexOf(personKey) !== -1;

	var FIELDS = ["name", "title", "phone", "email", "company", "website", "tel", "fax", "address"];

	function $id(id) { return document.getElementById(id); }

	/* ---------- Đọc file .vcf ---------- */

	// Gộp các dòng bị "gập" (dòng bắt đầu bằng khoảng trắng) theo chuẩn vCard
	function unfold(text) {
		return text.replace(/\r?\n[ \t]/g, "");
	}

	function unescapeVcf(value) {
		return value.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
	}

	// Địa chỉ trong file vcf cũ có <br> và <sup>: chuyển về văn bản thuần, mỗi dòng 1 ý
	function htmlAddressToText(value) {
		return value
			.replace(/<br\s*\/?>\s*/gi, "\n")
			.replace(/<\/?sup>/gi, "")
			.replace(/;+/g, " ")
			.replace(/[ \t]+/g, " ")
			.trim();
	}

	function parseVCF(text) {
		var data = { name: "", title: "", phone: "", email: "", company: "", website: "", tel: "", fax: "", address: "" };
		unfold(text).split(/\r?\n/).forEach(function (line) {
			var idx = line.indexOf(":");
			if (idx < 0) return;
			var key = line.slice(0, idx).toUpperCase();
			var value = unescapeVcf(line.slice(idx + 1).trim());
			var prop = key.split(";")[0];
			var types = key.slice(prop.length);

			if (prop === "FN") data.name = value;
			else if (prop === "TITLE") data.title = value;
			else if (prop === "ORG") data.company = value.replace(/;+$/, "");
			else if (prop === "EMAIL") data.email = value;
			else if (prop === "URL") data.website = value;
			else if (prop === "ADR") data.address = htmlAddressToText(value);
			else if (prop === "TEL") {
				if (/CELL/.test(types)) data.phone = value;
				else if (/FAX/.test(types)) data.fax = value;
				else data.tel += (data.tel ? " / " : "") + value;
			}
		});
		return data;
	}

	/* ---------- Form <-> dữ liệu ---------- */

	function readForm() {
		var data = {};
		FIELDS.forEach(function (f) { data[f] = ($id(f).value || "").trim(); });
		return data;
	}

	function fillForm(data) {
		FIELDS.forEach(function (f) { $id(f).value = data[f] || ""; });
	}

	/* ---------- Xem trước ---------- */

	function escapeHtml(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
		});
	}

	// "03Brd floor" -> 03B<sup>rd</sup>; mỗi dòng -> <br>
	function addressToHtml(address) {
		return escapeHtml(address)
			.replace(/\b(\d+[A-Z]?)(st|nd|rd|th)\b/g, "$1<sup>$2</sup>")
			.replace(/\n/g, "<br>");
	}

	function setLine(id, label, value) {
		var el = $id(id);
		el.style.display = value ? "" : "none";
		el.innerHTML = label ? "<b>" + label + ":</b> " + escapeHtml(value) : escapeHtml(value);
	}

	function updatePreview(data) {
		$id("preview-name").textContent = data.name;
		$id("preview-title").textContent = data.title;
		$id("preview-company").textContent = data.company;
		setLine("preview-phone", "Mobile", data.phone);
		setLine("preview-email", "Email", data.email);
		setLine("preview-tel", "Tel", data.tel);
		setLine("preview-fax", "Fax", data.fax);
		setLine("preview-website", "", data.website.replace(/^https?:\/\//, ""));
		$id("preview-address").innerHTML = addressToHtml(data.address);
	}

	/* ---------- vCard ---------- */

	function escapeVcf(value) {
		return String(value || "")
			.replace(/\\/g, "\\\\")
			.replace(/\n/g, "\\n")
			.replace(/([,;])/g, "\\$1");
	}

	// Tên Việt: Họ đứng đầu, Tên đứng cuối -> N:Họ;Tên;Tên đệm;;
	function formatName(fullName) {
		var parts = fullName.trim().split(/\s+/);
		if (parts.length < 2) return escapeVcf(fullName) + ";;;;";
		var family = parts[0];
		var given = parts[parts.length - 1];
		var middle = parts.slice(1, -1).join(" ");
		return [family, given, middle].map(escapeVcf).join(";") + ";;";
	}

	function buildVCard(data) {
		var lines = [
			"BEGIN:VCARD",
			"VERSION:3.0",
			"N:" + formatName(data.name),
			"FN:" + escapeVcf(data.name)
		];
		if (data.title) lines.push("TITLE:" + escapeVcf(data.title));
		if (data.company) lines.push("ORG:" + escapeVcf(data.company));
		if (data.phone) lines.push("TEL;TYPE=CELL:" + escapeVcf(data.phone));
		if (data.tel) lines.push("TEL;TYPE=WORK,VOICE:" + escapeVcf(data.tel));
		if (data.fax) lines.push("TEL;TYPE=WORK,FAX:" + escapeVcf(data.fax));
		if (data.email) lines.push("EMAIL;TYPE=INTERNET,WORK:" + escapeVcf(data.email));
		if (data.website) lines.push("URL:" + data.website);
		if (data.address) {
			// Gộp nhiều dòng thành 1 dòng địa chỉ (ô "street" của ADR)
			lines.push("ADR;TYPE=WORK:;;" + escapeVcf(data.address.replace(/\s*\n\s*/g, ", ")) + ";;;;");
		}
		lines.push("END:VCARD");
		return lines.join("\r\n");
	}

	/* ---------- Mã QR ---------- */

	var vcardQR = null;

	function renderVCardQR(data) {
		var options = {
			width: 300,
			height: 300,
			type: "canvas",
			data: buildVCard(data),
			image: "img/VTL_logo_square.svg",
			qrOptions: { errorCorrectionLevel: "Q" },
			imageOptions: { crossOrigin: "anonymous", margin: 2, imageSize: 0.25, hideBackgroundDots: true },
			dotsOptions: { color: "#333", type: "square" },
			backgroundOptions: { color: "#ffffff" },
			cornersSquareOptions: { type: "extra-rounded", color: "#006361" },
			cornersDotOptions: { type: "dot", color: "#e06800" }
		};
		if (vcardQR) {
			vcardQR.update(options);
		} else {
			vcardQR = new QRCodeStyling(options);
			var box = $id("qr-vcard");
			box.innerHTML = "";
			vcardQR.append(box);
		}
	}

	function renderWebsiteQR() {
		// QR mặt trước: link tới danh thiếp online của nhân viên (hoặc trang công ty)
		var url = isStaffCard
			? window.location.origin + window.location.pathname + "?name=" + personKey
			: ($id("website").value || "https://vtltech.com.vn");
		var box = $id("qr-website");
		box.innerHTML = "";
		new QRCode(box, {
			text: url,
			width: 160,
			height: 160,
			colorDark: "#006361",
			colorLight: "#ffffff",
			correctLevel: QRCode.CorrectLevel.M
		});
	}

	function updateNameCard() {
		var data = readForm();
		updatePreview(data);
		renderVCardQR(data);
		renderWebsiteQR();
		return data;
	}

	/* ---------- Tải về ---------- */

	function slug(name) {
		return (name || "namecard")
			.normalize("NFD").replace(/[̀-ͯ]/g, "")
			.replace(/đ/g, "d").replace(/Đ/g, "D")
			.replace(/[^\w]+/g, "_").replace(/^_|_$/g, "");
	}

	function downloadBlob(blob, filename) {
		var link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
	}

	function saveVCard() {
		var data = readForm();
		var blob = new Blob([buildVCard(data)], { type: "text/vcard;charset=utf-8" });
		downloadBlob(blob, slug(data.name) + ".vcf");
	}

	function downloadCardImages() {
		var name = slug(readForm().name);
		[["card-front", "_mat_truoc.png"], ["card-back", "_mat_sau.png"]].forEach(function (item) {
			html2canvas($id(item[0]), { scale: 3, backgroundColor: null, useCORS: true }).then(function (canvas) {
				canvas.toBlob(function (blob) { downloadBlob(blob, name + item[1]); });
			});
		});
	}

	/* ---------- Khởi động ---------- */

	function applyMode() {
		if (!isStaffCard) return;
		// Danh thiếp của nhân viên: chỉ xem, ẩn các ô nhập
		Array.prototype.forEach.call(document.querySelectorAll("#form-input .editable"), function (el) {
			el.style.display = "none";
		});
		$id("vcard_label").textContent = "Lưu thông tin liên hệ";
	}

	function init() {
		applyMode();
		$id("updatenamecard-btn").addEventListener("click", updateNameCard);
		$id("savenamecard-btn").addEventListener("click", saveVCard);
		$id("downloadcard-btn").addEventListener("click", downloadCardImages);
		$id("form-input").addEventListener("submit", function (e) { e.preventDefault(); updateNameCard(); });

		var vcfFile = isStaffCard ? "vcf/" + personKey + ".vcf" : "vcf/default.vcf";
		fetch(vcfFile)
			.then(function (res) {
				if (!res.ok) throw new Error(res.status + " " + vcfFile);
				return res.text();
			})
			.then(function (text) {
				var data = parseVCF(text);
				fillForm(data);
				if (isStaffCard && data.name) {
					$id("page-title").textContent = data.name;
					document.title = data.name + " - VTL Tech";
				}
				updateNameCard();
			})
			.catch(function (err) {
				console.error("Không tải được file VCF:", err);
				updateNameCard();
			});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
