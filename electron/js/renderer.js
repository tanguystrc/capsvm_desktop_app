import RFB from '@novnc/novnc';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.term');
    const url = 'ws://192.168.1.19:5700';
  
    const vnc = new RFB(container, url, {});
  });

var serverInfo;

window.onload = () => {
    getServer();
};

function getServer() {
    window.sqlite_server.getServers();
    window.sqlite_server.onServersGet((data) => {
        if (data.error) {
            console.error(data.error);
        } else {
            serverInfo = data;

            const menuElement = document.querySelector(".menu");
            menuElement.innerHTML = "";

            const addServer = document.createElement("div");
            addServer.className = "server addServer";
            addServer.innerHTML = "Add a Server";
            addServer.addEventListener("click", function () {
                showPopup();
                document.querySelector(".addServerPopup").style.display = "block";                    
                document.querySelector('input[name="serverName"]').value = "";
                document.querySelector('input[name="serverIp"]').value ="";
                document.querySelector('input[name="serverUsername"]').value = "";
                document.querySelector('input[name="serverPassword"]').value = "";
            });

            menuElement.appendChild(addServer);

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

                const img = document.createElement("img");
                img.src = "img/modify.png";
                img.className = "edit";
                img.addEventListener("click", function (event) {
                    event.stopPropagation();
                    showPopup();
                    document.querySelector(".addServerPopup").classList.add("editServerPopup");
                    document.querySelector(".addServerPopup").style.display = "block";
                    document.querySelector('input[name="serverName"]').value = server.name;
                    document.querySelector('input[name="serverIp"]').value = server.ip;
                    document.querySelector('input[name="serverUsername"]').value = server.user;
                    document.querySelector('input[name="serverPassword"]').value = server.password;
                    document.querySelector(".result").value = "Modify";
                    document.querySelector(".remove").style.display = "flex";
                });

                const tooltip = document.createElement("div");
                tooltip.className = "tooltip";
                tooltip.innerHTML = "Trying to connect";
                status.appendChild(tooltip);

                const token = btoa(server.user + ":" + server.password);
                const url = server.ip;

                getServerStatus(url, token, status, tooltip);

                serverStatus.appendChild(status);
                serverStatus.appendChild(img);
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
                    document.querySelector(".vmSelected").innerHTML = "All VM";

                    const allVm = document.createElement("div");
                    allVm.classList.add("vm", "allVm", "selected");
                    allVm.innerHTML = "All VM";
                    allVm.addEventListener("click", () => { 
                        const currentlySelected = document.querySelector(".vm.selected");
        
                        if(currentlySelected) {
                            currentlySelected.classList.remove("selected");
                        }
        
                        allVm.classList.add("selected");
                        if(allVm.innerHTML === "All VM") {
                            document.querySelector(".allvm").style.display = "flex";
                            document.querySelector(".onevm").style.display = "none";
                        } else {
                            document.querySelector(".allvm").style.display = "none";
                            document.querySelector(".onevm").style.display = "flex";
                        }
        
                        document.querySelector(".vmSelected").innerHTML = "All VM";
                    });
                    document.querySelector(".vmlist").appendChild(allVm);
                    document.querySelector(".allvm").style.display = "flex";
                    getVmList(server.name);
                });
            }
        }
    });
}

async function getServerStatus(serverUrl, combinedToken, status, tooltip) {
    try {
        const statusCode = await window.send_post_request.sendPostRequest(
            serverUrl,
            combinedToken,
            "function=getgroup",
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

document.querySelector(".newServerInfo").addEventListener("submit", function (event) {
        event.preventDefault();

        const serverName = document.querySelector(
            'input[name="serverName"]'
        ).value;
        const serverIp = document.querySelector(
            'input[name="serverIp"]'
        ).value;
        const serverUsername = document.querySelector(
            'input[name="serverUsername"]'
        ).value;
        const serverPassword = document.querySelector(
            'input[name="serverPassword"]'
        ).value;

        document.querySelector(".addServerPopup").style.display = "none";

        if(document.querySelector(".addServerPopup").classList.contains("editServerPopup")) {
            const lastName = document.querySelector(".server.selected .serverInfo").innerHTML.split(" - ")[0];
            window.sqlite_server.updateServer(
                serverName,
                serverIp,
                serverUsername,
                serverPassword,
                lastName
            );

            window.sqlite_server.onServerUpdate((data) => {
                if (data.error) {
                    console.log(data.error);
                } else {
                    getServer();
                }
            });
            document.querySelector(".addServerPopup").classList.remove("editServerPopup");
            document.querySelector(".result").value = "Add";
            closePopup();
        } else {
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
                    getServer();
                }
            });
            closePopup();
        }
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
            token,
            "function=statusallvm"
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
                if(newDiv.innerHTML === "All VM") {
                    document.querySelector(".allvm").style.display = "flex";
                    document.querySelector(".onevm").style.display = "none";
                } else {
                    document.querySelector(".allvm").style.display = "none";
                    document.querySelector(".onevm").style.display = "flex";
                }

                document.querySelector(".vmSelected").innerHTML = vmName;
                document.querySelector("#ham").classList.remove("is-active");
                document.querySelector(".menu").classList.remove("active");
            });
            vmListContainer.appendChild(newDiv);
        });
    } catch (error) {
        console.error("Erreur : ", error);
    }
}

function showPopup(){
    let pop = document.querySelector("#popupcontainer");
    pop.classList.toggle("open");
}

function closePopup(){
    let pop = document.querySelector("#popupcontainer");
    pop.classList.toggle("open");
    document.querySelector(".remove").style.display = "none";
}

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

function toggleButtons(enable) {
    const buttons = document.querySelectorAll("#start, #stop, #forcestop, #status, #reset, #ejectcd, #gencode, #getuuidshort, #screendump, #startallvmfo, #stopallvmfo, #statusallvm, #statusvmfo");
    buttons.forEach(button => {
        button.disabled = !enable;
    });
}

async function vmAction(function_name, vmShortName) {
    const serverName = document.querySelector(".servname").innerHTML;
    const server = serverInfo.server.find(s => s.name === serverName);

    if (server && vmShortName) {
        const token = btoa(server.user + ":" + server.password);
        const url = server.ip;

        toggleButtons(false);

        try {
            const response = await window.send_post_request.sendPostRequest(url, token, "function=" + function_name + "&short_name=" + vmShortName);

            if (response.statusCode === 200) {
                const vmReturnInfo = document.querySelector(".vmReturnInfo");
                vmReturnInfo.innerHTML += "> " + response.data + "<br><br>";
                vmReturnInfo.lastElementChild.scrollIntoView({ behavior: 'smooth' });
            } else {
                console.error("The request failed, response code: " + response.statusCode);
            }
        } catch (error) {
            console.error("The request failed, response code: ", error);
        } finally {
            toggleButtons(true);
        }
    } else {
        console.error("Server not found or no VM selected");
    }
}

document.querySelector("#start").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("startvm", vmShortName);
});

document.querySelector("#stop").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("stopvm", vmShortName);
});

document.querySelector("#forcestop").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("forcestopvm", vmShortName);
});

document.querySelector("#status").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("statusvm", vmShortName);
});

document.querySelector("#reset").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("resetvm", vmShortName);
});

document.querySelector("#ejectcd").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("ejectcd", vmShortName);
});

document.querySelector("#gencode").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("gencodevm", vmShortName);
});

document.querySelector("#getuuidshort").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("getuuidshortvm", vmShortName);
});

document.querySelector("#screendump").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("screendumpvm", vmShortName);
});

document.querySelector("#startallvmfo").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("startallvmfo", vmShortName);
});

document.querySelector("#stopallvmfo").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("stopallvmfo", vmShortName);
});

document.querySelector("#statusallvm").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("statusallvm", vmShortName);
});

document.querySelector("#statusvmfo").addEventListener("click", async () => {
    const vmShortName = document.querySelector(".vm.selected").innerHTML;
    vmAction("statusvmfo", vmShortName);
});


document.getElementById("searchInput").addEventListener("input", function() {
    const filter = this.value.toLowerCase();
    const vmElements = document.querySelectorAll(".vmlist .vm");
    
    vmElements.forEach(vmElement => {
        const vmName = vmElement.textContent.toLowerCase();
        if (vmName.includes(filter)) {
            vmElement.style.display = "flex";
        } else {
            vmElement.style.display = "none";
        }
    });
});

document.querySelector(".remove").addEventListener("click", function() {
    const serverName = document.querySelector(".server.selected").querySelector(".serverInfo").innerHTML.split(" - ")[0];
    window.sqlite_server.deleteServer(serverName);
    window.sqlite_server.onServerDelete((data) => {
        if (data.error) {
            console.log(data.error);
        } else {
            getServer();
        }
    });
    closePopup();
});