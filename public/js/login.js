function init() {
	$("#login-form12").show("slow");
	$("#login-title").addClass('animated bounceInLeft');
	$("#mBtn").click(function() {
		$('body').addClass('animated bounceOutLeft');
	});
}

$(document).on('ready', init);