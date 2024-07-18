var serverInfo;

window.onload = () => {
    window.sqlite_server.getServers();
    window.sqlite_server.onServersGet((data) => {
        if (data.error) {
            console.error(data.error);
        } else {
            serverInfo = data;
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
                tooltip.innerHTML = "Trying to connect";
                status.appendChild(tooltip);

                const token = btoa(server.user + ":" + server.password);
                const url = server.ip;

                getServerStatus(url, token, status, tooltip);

                serverStatus.appendChild(status);
                newDiv.appendChild(serverStatus);

                document.querySelector(".menu").appendChild(newDiv);

                newDiv.addEventListener("click", () => {
                    const currentlySelected = document.querySelector(".server.selected");

                    if(currentlySelected) {
                        currentlySelected.classList.remove("selected");
                    }

                    newDiv.classList.add("selected");
                    document.querySelector(".servname").innerHTML = server.name;
                    document.querySelector(".menu").classList.remove("active");
                    document.querySelector("#ham").classList.remove("is-active");
                    document.querySelectorAll(".vm").forEach((vm) => {
                        vm.remove();
                    });
                    getVmList(server.name);
                });
            }
        }
    });
};

async function getServerStatus(serverUrl, combinedToken, status, tooltip) {
    try {
        const statusCode = await window.get_server_status.sendPostRequest(
            serverUrl,
            "/capsvm_api/getgroup/",
            combinedToken
        );
        if (statusCode.statusCode === 200) {
            status.style.backgroundColor = "green";
            tooltip.innerHTML = "Server is up";
        } else if (statusCode.statusCode === 401) {
            status.style.backgroundColor = "red";
            tooltip.innerHTML = "Unauthorized";
        } else {
            status.style.backgroundColor = "black";
            tooltip.innerHTML = "Server is down";
        }
    } catch (error) {
        status.style.backgroundColor = "black";
        tooltip.innerHTML = "Server is down";
        console.error("Erreur : ", error);
    }
}

document.querySelector("#ham").addEventListener("click", function () {
    this.classList.toggle("is-active");
    document.querySelector(".menu").classList.toggle("active");
});

document.querySelector(".addServer").addEventListener("click", function () {
    document.querySelector(".addServerPopup").style.display = "block";
});

document
    .querySelector(".newServerInfo")
    .addEventListener("submit", function (event) {
        event.preventDefault();

        const serverName = document.querySelector(
            'input[name="serverName"]'
        ).value;
        const serverIp = document.querySelector('input[name="serverIp"]').value;
        const serverUsername = document.querySelector(
            'input[name="serverUsername"]'
        ).value;
        const serverPassword = document.querySelector(
            'input[name="serverPassword"]'
        ).value;
        document.querySelector(".addServerPopup").style.display = "none";

        window.sqlite_server.addServer(
            serverName,
            serverIp,
            serverUsername,
            serverPassword
        );
        window.sqlite_server.onServerAdd((data) => {
            if (data.error) {
                console.log(data.error);
            } else {
                serverInfo.server.push({
                    name: serverName,
                    ip: serverIp,
                    user: serverUsername,
                    password: serverPassword,
                });
                const newDiv = document.createElement("div");
                newDiv.className = "server";

                const serverInfo = document.createElement("div");
                serverInfo.innerHTML = serverName + " - " + serverIp;
                serverInfo.className = "serverInfo";
                newDiv.appendChild(serverInfo);

                const serverStatus = document.createElement("div");
                serverStatus.className = "serverStatus";

                const status = document.createElement("div");
                status.className = "status";

                const tooltip = document.createElement("div");
                tooltip.className = "tooltip";
                tooltip.innerHTML = "Trying to connect";
                status.appendChild(tooltip);

                const token = btoa(serverUsername + ":" + serverPassword);
                const url = serverIp;

                getServerStatus(url, token, status, tooltip);

                serverStatus.appendChild(status);
                newDiv.appendChild(serverStatus);

                document.querySelector(".menu").appendChild(newDiv);
            }
        });
    });

async function getVmList(serverName) {
    const server = serverInfo.server.find(
        (server) => server.name === serverName
    );
    const token = btoa(server.user + ":" + server.password);
    const url = server.ip;

    try {
        const vmList = await window.send_post_request.sendPostRequest(
            url,
            "/capsvm_api/vm/statusallvm/",
            token,
            ""
        );

        const vmListContainer = document.querySelector(".vmlist");
        const regex = /Status for VM "(.*?)"/g;
        let match;
        const vmNames = [];

        while ((match = regex.exec(vmList.data)) !== null) {
            vmNames.push(match[1]);
        }

        vmNames.forEach((vmName) => {
            const newDiv = document.createElement("div");
            newDiv.className = "vm";
            newDiv.innerHTML = vmName;
            newDiv.addEventListener("click", () => { 
                const currentlySelected = document.querySelector(".vm.selected");

                if(currentlySelected) {
                    currentlySelected.classList.remove("selected");
                }

                newDiv.classList.add("selected");

                document.querySelector(".vmname").innerHTML = vmName;
                document.querySelector("#ham").classList.remove("is-active");
                document.querySelector(".menu").classList.remove("active");
            });
            vmListContainer.appendChild(newDiv);
        });
    } catch (error) {
        console.error("Erreur : ", error);
    }
}

function showPopup() {
    document.querySelector('.overlay').classList.add('active');
    document.querySelector('.addServerPopup').classList.add('active');
}

function hidePopup() {
    document.querySelector('.overlay').classList.remove('active');
    document.querySelector('.addServerPopup').classList.remove('active');
}

document.querySelector('.overlay').addEventListener('click', hidePopup);

document.querySelector('.newServerInfo').addEventListener('submit', function(event) {
    event.preventDefault();
    hidePopup();
});

const themeButton = document.querySelector('.option-button.theme');
themeButton.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const themeIcon = themeButton.querySelector('img');
    if (document.body.classList.contains('light-theme')) {
        themeIcon.src = 'img/sun.png'; 
        themeIcon.alt = 'Light Theme';
    } else {
        themeIcon.src = 'img/moon.png';
        themeIcon.alt = 'Dark Theme';
    }
});
