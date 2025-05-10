$(()=>{
    $('.markdown-it-code-copy').on('click', (e) => {
        const text=$(e.currentTarget).data('clipboard-text'); 
        console.log(text);
        copyToClipboard(text);
    });
});

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    .catch(err => {
        console.error('Failed to copy text: ', err);
    });
}