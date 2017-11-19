import STORAGE from '../constant/storage'

const wallpaper = localStorage.getItem(STORAGE.WALLPAPER);

if (wallpaper) {
    document.body.style.background = `url(${wallpaper})`;
}
