document.querySelector('#ham').addEventListener('click', function() {
    this.classList.toggle('is-active');
    document.querySelector('.menu').classList.toggle('active');
});
window.onload = () => {
    window.sqlite_server.getServers();
    window.sqlite_server.onServersGet((data) => {
        if (data.error) {
            document.querySelector("#server_info").innerHTML = data.error;
        } else {
            document.querySelector("#server_info").innerHTML = data.server[0].name;
        }
    });
};
