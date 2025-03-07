export function setTitle(title) {
    if(title && title.length > 0) {
        document.title = `在线工具 | ${title}`
    } else {
        document.title = '在线工具'
    }
}