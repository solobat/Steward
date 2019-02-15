import axios from 'axios'

export function shorten(longurl) {
    const url = 'https://is.gd/create.php?';
	return axios.get(url, {
        params: {
            format: 'simple',
			url: longurl
        }
    }).then(info => {
        return info.data;
    });
}