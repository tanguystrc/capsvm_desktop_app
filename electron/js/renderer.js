document.querySelector('#ham').addEventListener('click', function() {
    this.classList.toggle('is-active');
    document.querySelector('.menu').classList.toggle('active');
});
