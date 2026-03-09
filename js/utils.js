const k = 1024;
const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];


export function formatSize(bytes, decimals = 2) {
    if (!+bytes) return '';

    const dm = decimals < 0 ? 0 : decimals;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const index = Math.min(i, sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, index)).toFixed(dm))} ${sizes[index]}`;
}


export function getFileName(path) {
    const cleanPath = path.split(/[?#]/)[0];
    return cleanPath.split(/[\\/]/).pop().trim();
}


export function sortBy(array, keys) {
    return array.sort((a, b) => {
        for (const key of keys) {
            const compare = String(a[key]).localeCompare(String(b[key]));
            if (compare !== 0) {
                return compare;
            }
        }
        return 0;
    });
}
