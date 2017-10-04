var _gaq = window._gaq || (window._gaq = []);
_gaq.push(['_setAccount', 'UA-106561500-1']);
_gaq.push(['_trackPageview']);

export default function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
}