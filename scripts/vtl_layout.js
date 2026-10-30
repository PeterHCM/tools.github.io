/*
 * Layout dùng chung cho mọi trang công cụ (top bar, header, menu, footer).
 * Chèn đồng bộ vào #site-header / #site-footer, nên chỉ cần sửa ở một chỗ.
 * Phải được nạp SAU jQuery + Bootstrap và TRƯỚC script riêng của từng trang.
 */
(function ($) {
	"use strict";

	var COMPANY = {
		name: "Công ty TNHH Kỹ Thuật Việt Thắng Lợi",
		nameUpper: "CÔNG TY TNHH KỸ THUẬT VIỆT THẮNG LỢI",
		taxId: "0305557155",
		address: "Lầu 3B Tòa Nhà Scetpa, 19A Cộng Hòa, Phường Bảy Hiền, Thành phố Hồ Chí Minh",
		mapUrl: "https://goo.gl/maps/gm5F9GDgof6HKbjE8",
		phone: "(028) 3811 0510",
		phoneHref: "+842838110510",
		fax: "(028) 3811 0512",
		email: "info@vtltech.com.vn",
		website: "https://vtltech.com.vn",
		facebook: "https://www.facebook.com/vtltech.com.vn/",
		youtube: "https://www.youtube.com/c/VTLTECHCOLTD"
	};

	// Danh sách nhân viên có danh thiếp (key = tên file trong thư mục vcf/)
	var STAFF = [
		{ key: "peter", name: "Nguyễn Kim Phúc" },
		{ key: "bill",  name: "Bùi Văn Hậu" },
		{ key: "huong", name: "Nguyễn Thị Hương" },
		{ key: "jenny", name: "Tô Hương Uyên" },
		{ key: "vi",    name: "Võ Thị Hồng Vi" },
		{ key: "tuan",  name: "Nguyễn Minh Tuấn" }
	];
	window.VTL_STAFF = STAFF;

	var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
	function active(file) {
		return page === file || (file === "index.html" && page === "") ? " active" : "";
	}

	var staffMenu = STAFF.map(function (s) {
		return '<li><a href="namecards.html?name=' + s.key + '">' + s.name + '</a></li>';
	}).join("");

	var headerHtml =
		'<div id="top-bar" class="top-bar">' +
		'  <div class="container"><div class="row">' +
		'    <div class="col-md-9 col-sm-8 col-xs-12">' +
		'      <ul class="top-info"><li>' +
		'        <a href="' + COMPANY.mapUrl + '" target="_blank" rel="noopener">' +
		'          <i class="fa fa-map-marker"></i> <span class="info-text">' + COMPANY.address + '</span>' +
		'        </a>' +
		'      </li></ul>' +
		'    </div>' +
		'    <div class="col-md-3 col-sm-4 col-xs-12 top-social text-right">' +
		'      <ul class="unstyled"><li>' +
		'        <a title="Facebook" href="' + COMPANY.facebook + '" target="_blank" rel="noopener"><span class="social-icon"><i class="fa fa-facebook"></i></span></a>' +
		'        <a title="Youtube" href="' + COMPANY.youtube + '" target="_blank" rel="noopener"><span class="social-icon"><i class="fa fa-youtube"></i></span></a>' +
		'      </li></ul>' +
		'    </div>' +
		'  </div></div>' +
		'</div>' +
		'<header id="header" class="header-one">' +
		'  <div class="container"><div class="row"><div class="logo-area clearfix">' +
		'    <div class="logo col-xs-12 col-md-3">' +
		'      <a href="index.html"><img src="img/VTL_logo.svg" alt="' + COMPANY.name + '"></a>' +
		'    </div>' +
		'    <div class="col-xs-12 col-md-9 header-right">' +
		'      <ul class="top-info-box">' +
		'        <li><div class="info-box"><div class="info-box-content">' +
		'          <p class="info-box-title">Điện thoại</p>' +
		'          <p class="info-box-subtitle"><a href="tel:' + COMPANY.phoneHref + '">' + COMPANY.phone + '</a></p>' +
		'        </div></div></li>' +
		'        <li><div class="info-box"><div class="info-box-content">' +
		'          <p class="info-box-title">Email</p>' +
		'          <p class="info-box-subtitle"><a href="mailto:' + COMPANY.email + '">' + COMPANY.email + '</a></p>' +
		'        </div></div></li>' +
		'        <li class="last"><div class="info-box last"><div class="info-box-content">' +
		'          <p class="info-box-title">Fax</p>' +
		'          <p class="info-box-subtitle">' + COMPANY.fax + '</p>' +
		'        </div></div></li>' +
		'        <li class="header-get-a-quote"><a class="btn btn-primary" href="' + COMPANY.website + '" target="_blank" rel="noopener">Website công ty</a></li>' +
		'      </ul>' +
		'    </div>' +
		'  </div></div></div>' +
		'  <nav class="site-navigation navigation navdown">' +
		'    <div class="nav-container container"><div class="row"><div class="col-sm-12">' +
		'      <div class="site-nav-inner pull-left">' +
		'        <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">' +
		'          <span class="sr-only">Mở menu</span><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>' +
		'        </button>' +
		'        <div class="collapse navbar-collapse navbar-responsive-collapse">' +
		'          <ul class="nav navbar-nav">' +
		'            <li class="nav-link' + active("index.html") + '"><a href="index.html">Trang chủ</a></li>' +
		'            <li class="nav-link' + active("qr.html") + '"><a href="qr.html">Quét mã sản phẩm</a></li>' +
		'            <li class="dropdown' + active("namecards.html") + '">' +
		'              <a href="namecards.html" class="dropdown-toggle">Danh thiếp <i class="fa fa-angle-down"></i></a>' +
		'              <ul class="dropdown-menu">' + staffMenu + '</ul>' +
		'            </li>' +
		'          </ul>' +
		'        </div>' +
		'      </div>' +
		'    </div></div></div>' +
		'  </nav>' +
		'</header>';

	var footerHtml =
		'<footer id="footer" class="footer bg-overlay">' +
		'  <div class="copyright"><div class="container"><div class="row">' +
		'    <div class="col-xs-12 col-sm-9"><div class="copyright-info">' +
		'      <span>Copyright &copy; ' + new Date().getFullYear() + ' Bản quyền thuộc về ' + COMPANY.nameUpper + ' – ĐKKD số: ' + COMPANY.taxId + '</span>' +
		'    </div></div>' +
		'    <div class="col-xs-12 col-sm-3"><div class="footer-menu">' +
		'      <ul class="nav unstyled">' +
		'        <li><a href="' + COMPANY.website + '" target="_blank" rel="noopener">Giới thiệu</a></li>' +
		'        <li><a href="mailto:' + COMPANY.email + '">Liên hệ</a></li>' +
		'      </ul>' +
		'    </div></div>' +
		'  </div></div></div>' +
		'</footer>' +
		'<div id="back-to-top" class="back-to-top affix" style="display:none">' +
		'  <button class="btn btn-primary" title="Lên đầu trang"><i class="fa fa-angle-double-up"></i></button>' +
		'</div>';

	$("#site-header").replaceWith(headerHtml);
	$("#site-footer").replaceWith(footerHtml);

	// Menu dính trên đầu khi cuộn + nút "lên đầu trang"
	$(window).on("scroll", function () {
		var y = $(window).scrollTop();
		$(".navdown").toggleClass("navbar-fixed", y > 70);
		$("#back-to-top").toggle(y > 50);
	});
	$("#back-to-top").on("click", function () {
		$("html, body").animate({ scrollTop: 0 }, 600);
	});

	// Trên điện thoại: chạm "Danh thiếp" lần đầu sẽ mở danh sách nhân viên
	$(".navbar-nav .dropdown > a").on("click", function (e) {
		if ($(window).width() < 768) {
			var $menu = $(this).siblings(".dropdown-menu");
			if (!$menu.is(":visible")) {
				e.preventDefault();
				$menu.slideDown(200);
			}
		}
	});
})(jQuery);
