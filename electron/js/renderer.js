import RFB from '@novnc/novnc';

let serverInfo;

/**
 * Initialize the VNC for remote connection.
 */
    function initVNC(serverIp, vncPort) {
        const container = document.querySelector('.vnc');
        container.innerHTML = '';
        const url = `ws://${serverIp}:570${vncPort}`;
        try {
            const vnc = new RFB(container, url, {});
            vnc.scaleViewport = true;
        } catch (error) {
        }
    }

// Execute after the window is loaded
window.onload = fetchServers;

/**
 * Get the list of available servers.
 */
function fetchServers() {
    window.sqlite_server.getServers();
    window.sqlite_server.onServersGet(handleServerData);
}

/**
 * Handles the server data retrieved from SQLite.
 * @param {Object} data - The server data.
 */
function handleServerData(data) {
    if (data.error) {
        console.error(data.error);
        return;
    }

    serverInfo = data;
    renderServers(data.server);
    setupAddServerButton();
}

/**
 * Display the servers in the menu.
 * @param {Array} servers - List of servers.
 */
function renderServers(servers) {
    const menuElement = document.querySelector('.menu');
    menuElement.innerHTML = '';

    servers.forEach(server => {
        const serverElement = createServerElement(server);
        menuElement.appendChild(serverElement);
    });
}

/**
 * Create and return a DOM element representing a server.
 * @param {Object} server - The server information.
 * @returns {HTMLElement} - The DOM element of the server.
 */
function createServerElement(server) {
    const serverElement = document.createElement('div');
    serverElement.className = 'server';

    const serverInfo = document.createElement('div');
    serverInfo.className = 'serverInfo';
    serverInfo.innerHTML = `${server.name} - ${server.ip}`;
    serverElement.appendChild(serverInfo);

    const serverStatus = document.createElement('div');
    serverStatus.className = 'serverStatus';
    const status = document.createElement('div');
    status.className = 'status';

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerHTML = 'Trying to connect';
    status.appendChild(tooltip);

    const img = document.createElement('img');
    img.src = 'img/modify.png';
    img.className = 'edit';
    img.addEventListener('click', event => {
        event.stopPropagation();
        showEditServerPopup(server);
    });

    serverStatus.appendChild(status);
    serverStatus.appendChild(img);
    serverElement.appendChild(serverStatus);

    serverElement.addEventListener('click', () => {
        selectServer(serverElement, server.name);
    });

    const token = btoa(`${server.user}:${server.password}`);
    getServerStatus(server.ip, token, status, tooltip);

    return serverElement;
}

/**
 * Handles the click event on the button to add a server.
 */
function setupAddServerButton() {
    const menuElement = document.querySelector('.menu');
    const addServer = document.createElement('div');
    addServer.className = 'server addServer';
    addServer.innerHTML = 'Add a Server';
    addServer.addEventListener('click', () => {
        showPopup();
        clearServerFormFields();
        displayAddServerPopup();
    });
    menuElement.appendChild(addServer);
}

/**
 * Displays the popup to modify an existing server.
 * @param {Object} server - The server information to modify.
 */
function showEditServerPopup(server) {
    showPopup();
    const popup = document.querySelector('.addServerPopup');
    popup.classList.add('editServerPopup');
    displayAddServerPopup();

    document.querySelector('input[name="serverName"]').value = server.name;
    document.querySelector('input[name="serverIp"]').value = server.ip;
    document.querySelector('input[name="serverUsername"]').value = server.user;
    document.querySelector('input[name="serverPassword"]').value = server.password;
    document.querySelector('.result').value = 'Modify';
    document.querySelector('.remove').style.display = 'flex';
}

function displayAddServerPopup() {
    document.querySelector('.addServerPopup').style.display = 'block';
}

/**
 * Clear the server form fields.
 */
function clearServerFormFields() {
    document.querySelector('input[name="serverName"]').value = '';
    document.querySelector('input[name="serverIp"]').value = '';
    document.querySelector('input[name="serverUsername"]').value = '';
    document.querySelector('input[name="serverPassword"]').value = '';
}

/**
 * Selects a server and displays its VMs.
 * @param {HTMLElement} serverElement - The DOM element of the selected server.
 * @param {string} serverName - The name of the selected server.
 */
function selectServer(serverElement, serverName) {
    const currentlySelected = document.querySelector('.server.selected');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected');
    }
    serverElement.classList.add('selected');

    document.querySelector('.servname').innerHTML = serverName;
    document.querySelector('.menu').classList.remove('active');
    document.querySelector('#ham').classList.remove('is-active');
    document.querySelector('.onevm').style.display = "none";
    document.querySelector('.vnc').innerHTML = '';
    clearVmList();
    displayAllVM();
    fetchVmList(serverName);
}

function clearVmList() {
    document.querySelectorAll('.vm').forEach(vm => vm.remove());
}

/**
 * Display "All VM" in the list of VMs.
 */
function displayAllVM() {
    const allVm = document.createElement('div');
    allVm.classList.add('vm', 'allVm', 'selected');
    allVm.innerHTML = 'All VM';
    allVm.addEventListener('click', () => {
        selectVm(allVm);
        toggleVmDisplay('All VM');
    });
    document.querySelector('.vmlist').appendChild(allVm);
    document.querySelector('.allvm').style.display = 'flex';
}

/**
 * Selects a virtual machine and retrieves the associated server IP.
 * @param {HTMLElement} vmElement - The element of the VM to select.
 */
function selectVm(vmElement) {
    const currentlySelected = document.querySelector('.vm.selected');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected');
    }

    vmElement.classList.add('selected');
    
    const selectedServer = document.querySelector('.server.selected');
    const allVmElement = document.querySelector('.vm.allVm');    
    
    if (selectedServer && vmElement !== allVmElement) {
        const vncPort = vmElement.getAttribute('data-port');
        const serverIp = selectedServer.querySelector('.serverInfo').textContent.split(' - ')[1];
        initVNC(serverIp, vncPort);
    }
}

/**
 * Displays or hides the VMs based on the selection.
 * @param {string} vmName - The name of the selected VM.
 */
function toggleVmDisplay(vmName) {
    if (vmName === 'All VM') {
        document.querySelector('.allvm').style.display = 'flex';
        document.querySelector('.onevm').style.display = 'none';
    } else {
        document.querySelector('.allvm').style.display = 'none';
        document.querySelector('.onevm').style.display = 'flex';
    }
    document.querySelector('.vmSelected').innerHTML = vmName;
}

/**
 * Retrieves the status of a server.
 * @param {string} serverUrl - Server URL.
 * @param {string} combinedToken - Authentication token.
 * @param {HTMLElement} status - DOM element for status.
 * @param {HTMLElement} tooltip - DOM element for tooltip.
 */
async function getServerStatus(serverUrl, combinedToken, status, tooltip) {
    try {
        const statusCode = await window.send_post_request.sendPostRequest(serverUrl, combinedToken, 'function=getgroup');

        switch (statusCode.statusCode) {
            case 200:
                status.style.backgroundColor = 'green';
                tooltip.innerHTML = 'Server is up';
                break;
            case 401:
                status.style.backgroundColor = 'red';
                tooltip.innerHTML = 'Unauthorized';
                break;
            default:
                status.style.backgroundColor = 'black';
                tooltip.innerHTML = 'Server is down';
                break;
        }
    } catch (error) {
        status.style.backgroundColor = 'black';
        tooltip.innerHTML = 'Server is down';
    }
}

document.querySelector('#ham').addEventListener('click', function () {
    this.classList.toggle('is-active');
    document.querySelector('.menu').classList.toggle('active');
});

document.querySelector('.close').addEventListener('click', closePopup);

document.querySelector('.newServerInfo').addEventListener('submit', handleServerFormSubmit);

/**
 * Handles the submission of the server add/edit form.
 * @param {Event} event - The form submission event.
 */
function handleServerFormSubmit(event) {
    event.preventDefault();

    const serverName = document.querySelector('input[name="serverName"]').value;
    const serverIp = document.querySelector('input[name="serverIp"]').value;
    const serverUsername = document.querySelector('input[name="serverUsername"]').value;
    const serverPassword = document.querySelector('input[name="serverPassword"]').value;

    const popup = document.querySelector('.addServerPopup');
    popup.style.display = 'none';

    if (popup.classList.contains('editServerPopup')) {
        updateServer(serverName, serverIp, serverUsername, serverPassword);
    } else {
        addNewServer(serverName, serverIp, serverUsername, serverPassword);
    }
}

/**
 * Updates an existing server.
 * @param {string} name - Server name.
 * @param {string} ip - Server IP address.
 * @param {string} username - Server username.
 * @param {string} password - Server password.
 */
function updateServer(name, ip, username, password) {
    const lastName = document.querySelector('.server.selected .serverInfo').innerHTML.split(' - ')[0];

    window.sqlite_server.updateServer(name, ip, username, password, lastName);
    window.sqlite_server.onServerUpdate(handleServerUpdate);

    document.querySelector('.addServerPopup').classList.remove('editServerPopup');
    document.querySelector('.result').value = 'Add';
    closePopup();
}

/**
 * Handles server update.
 * @param {Object} data - The update data.
 */
function handleServerUpdate(data) {
    if (data.error) {
        console.log(data.error);
    } else {
        fetchServers();
    }
}

/**
 * Adds a new server.
 * @param {string} name - Server name.
 * @param {string} ip - Server IP address.
 * @param {string} username - Server username.
 * @param {string} password - Server password.
 */
function addNewServer(name, ip, username, password) {
    window.sqlite_server.addServer(name, ip, username, password);
    window.sqlite_server.onServerAdd(handleServerAdd);
    closePopup();
}

/**
 * Handles the addition of a server.
 * @param {Object} data - The addition data.
 */
function handleServerAdd(data) {
    if (data.error) {
        console.log(data.error);
    } else {
        fetchServers();
    }
}

/**
 * Retrieves the list of VMs for a server.
 * @param {string} serverName - The name of the server.
 */
async function fetchVmList(serverName) {
    const server = serverInfo.server.find(s => s.name === serverName);

    if (!server) {
        console.error('Server not found');
        return;
    }

    const token = btoa(`${server.user}:${server.password}`);
    const url = server.ip;

    try {
        const vmList = await window.send_post_request.sendPostRequest(url, token, 'function=statusallvm');
        renderVmList(vmList.data);
    } catch (error) {
    }
}

/**
 * Renders the list of virtual machines.
 * @param {string} vmData - The data of the virtual machines.
 */
function renderVmList(vmData) {
    const vmListContainer = document.querySelector('.vmlist');
    const regex = /Status for VM "(.*?)" : "(.*?)" : .*? : VNC Port (\d+) :(\w+)/g;

    let match;
    const vmPorts = {};

    while ((match = regex.exec(vmData)) !== null) {
        const vmName = match[1];
        const vncPort = match[3];

        vmPorts[vmName] = vncPort;
    }

    for (const [vmName, port] of Object.entries(vmPorts)) {
        const vmElement = document.createElement('div');
        vmElement.className = 'vm';
        vmElement.innerHTML = vmName;
        
        vmElement.dataset.port = port;

        vmElement.addEventListener('click', () => {
            selectVm(vmElement);
            toggleVmDisplay(vmName);
        });

        vmListContainer.appendChild(vmElement);
    }
}

function showPopup() {
    const pop = document.querySelector('#popupcontainer');
    pop.classList.toggle('open');
}

function closePopup() {
    const pop = document.querySelector('#popupcontainer');
    pop.classList.toggle('open');
    document.querySelector('.remove').style.display = 'none';
}

document.querySelector('.option-button.theme').addEventListener('click', toggleTheme);

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const themeIcon = document.querySelector('.option-button.theme img');
    const isLightTheme = document.body.classList.contains('light-theme');
    themeIcon.src = isLightTheme ? 'img/sun.png' : 'img/moon.png';
    themeIcon.alt = isLightTheme ? 'Light Theme' : 'Dark Theme';
}

/**
 * Enables or disables the VM action buttons.
 * @param {boolean} enable - Indicates whether the buttons should be enabled.
 */
function toggleButtons(enable) {
    const buttons = document.querySelectorAll('#start, #stop, #forcestop, #status, #reset, #ejectcd, #gencode, #getuuidshort, #screendump, #startallvmfo, #stopallvmfo, #statusallvm, #statusvmfo');
    buttons.forEach(button => {
        button.disabled = !enable;
    });
}

/**
 * Performs an action on a VM.
 * @param {string} functionName - The name of the function to call.
 * @param {string} vmShortName - The short name of the VM.
 */
async function vmAction(functionName, vmShortName) {
    const serverName = document.querySelector('.servname').innerHTML;
    const server = serverInfo.server.find(s => s.name === serverName);

    if (!server || !vmShortName) {
        console.error('Server not found or no VM selected');
        return;
    }

    const token = btoa(`${server.user}:${server.password}`);
    const url = server.ip;

    toggleButtons(false);

    try {
        const response = await window.send_post_request.sendPostRequest(url, token, `function=${functionName}&short_name=${vmShortName}`);

        if (response.statusCode === 200) {

            if(functionName === 'startvm') {
                document.querySelector('.vm.selected').click();
            }
            const vmReturnInfo = document.querySelector('.vmReturnInfo');
            vmReturnInfo.innerHTML += `> ${response.data}<br><br>`;
            vmReturnInfo.lastElementChild.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.error('The request failed, response code: ' + response.statusCode);
        }
    } catch (error) {
        console.error('The request failed, response code: ', error);
    } finally {
        toggleButtons(true);
    }
}

document.querySelector('#start').addEventListener('click', () => vmActionFromSelected('startvm'));
document.querySelector('#stop').addEventListener('click', () => vmActionFromSelected('stopvm'));
document.querySelector('#forcestop').addEventListener('click', () => vmActionFromSelected('forcestopvm'));
document.querySelector('#status').addEventListener('click', () => vmActionFromSelected('statusvm'));
document.querySelector('#reset').addEventListener('click', () => vmActionFromSelected('resetvm'));
document.querySelector('#ejectcd').addEventListener('click', () => vmActionFromSelected('ejectcd'));
document.querySelector('#gencode').addEventListener('click', () => vmActionFromSelected('gencodevm'));
document.querySelector('#getuuidshort').addEventListener('click', () => vmActionFromSelected('getuuidshortvm'));
document.querySelector('#screendump').addEventListener('click', () => vmActionFromSelected('screendumpvm'));
document.querySelector('#startallvmfo').addEventListener('click', () => vmActionFromSelected('startallvmfo'));
document.querySelector('#stopallvmfo').addEventListener('click', () => vmActionFromSelected('stopallvmfo'));
document.querySelector('#statusallvm').addEventListener('click', () => vmActionFromSelected('statusallvm'));
document.querySelector('#statusvmfo').addEventListener('click', () => vmActionFromSelected('statusvmfo'));

/**
 * Executes a VM action for the selected VM.
 * @param {string} functionName - Name of the function to call.
 */
function vmActionFromSelected(functionName) {
    const vmShortName = document.querySelector('.vm.selected').innerHTML;
    vmAction(functionName, vmShortName);
}

document.getElementById('searchInput').addEventListener('input', filterVmList);

/**
 * Filters the list of VMs based on the search input.
 * @param {Event} event - The search input event.
 */
function filterVmList(event) {
    const filter = event.target.value.toLowerCase();
    const vmElements = document.querySelectorAll('.vmlist .vm');

    vmElements.forEach(vmElement => {
        const vmName = vmElement.textContent.toLowerCase();
        vmElement.style.display = vmName.includes(filter) ? 'flex' : 'none';
    });
}

document.querySelector('.remove').addEventListener('click', deleteServer);

function deleteServer() {
    const serverName = document.querySelector('.server.selected .serverInfo').innerHTML.split(' - ')[0];
    window.sqlite_server.deleteServer(serverName);
    window.sqlite_server.onServerDelete(handleServerDelete);
    closePopup();
}

/**
 * Handles server deletion.
 * @param {Object} data - The deletion data.
 */
function handleServerDelete(data) {
    if (data.error) {
        console.log(data.error);
    } else {
        fetchServers();
    }
}

export { fetchServers, toggleButtons, vmAction, deleteServer, vmActionFromSelected };