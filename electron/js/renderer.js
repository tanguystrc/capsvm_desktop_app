window.addEventListener('DOMContentLoaded', () => {
    window.sqlite_server.getServers();
    window.sqlite_server.onServersGet((data) => {
        if (data.error) {
            console.error(data.error);
        } else {
            for (const server of data.server) {
                const newDiv = document.createElement("div");
                newDiv.className = "server";

                const serverInfo = document.createElement("div");
                serverInfo.innerHTML = server.name + " - " + server.ip;
                serverInfo.className = "serverInfo";
                newDiv.appendChild(serverInfo);

                const serverStatus = document.createElement("div");
                serverStatus.className = "serverStatus";

                const status = document.createElement("div");
                status.className = "status";

                const tooltip = document.createElement("div");
                tooltip.className = "tooltip";
                status.appendChild(tooltip);

                const token = btoa(server.user + ":" + server.password);
                const url = server.ip;
                
                getServerStatus(url, token, status, tooltip);

                serverStatus.appendChild(status);
                newDiv.appendChild(serverStatus);

                document.querySelector(".menu").appendChild(newDiv);

                newDiv.addEventListener("click", () => {
                    document.querySelector(".servname").innerHTML = server.name;
                });
            }
        }
    });
});

async function getServerStatus(serverUrl, combinedToken, status, tooltip) {
    try {
        const statusCode = await window.get_server_status.sendPostRequest(serverUrl, "/capsvm_api/getgroup/", combinedToken);
        if (statusCode.statusCode === 200) {
            status.style.backgroundColor = "green";
            tooltip.innerHTML = "Server is up";
        } else if (statusCode.statusCode === 401) {
            status.style.backgroundColor = "black";
            tooltip.innerHTML = "Unauthorized";
        }
    } catch (error) {
        status.style.backgroundColor = "red";
        tooltip.innerHTML = "Server is down";
        console.error('Erreur : ', error);
    }
}

document.querySelector('#ham').addEventListener('click', function() {
    this.classList.toggle('is-active');
    document.querySelector('.menu').classList.toggle('active');
});
