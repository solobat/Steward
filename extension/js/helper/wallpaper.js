const wallpaper = localStorage.getItem('wallpaper');

if (wallpaper) {
    document.body.style.background = `url(${wallpaper})`;
}
