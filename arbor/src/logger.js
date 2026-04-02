
const arborLogger = {

    studentId: null,
    serverUrl: "https://codap-log-server.onrender.com/api/logs",

    initialize: function () {
        const name = prompt("Lutfen adinizi ve soyadinizi girin:");
        if (name && name.trim()) {
            this.studentId = name.trim().toLowerCase().replace(/\s+/g, "_");
        } else {
            this.studentId = "unknown_" + Date.now();
        }
        console.log("[Logger] Ogrenci ID:", this.studentId);
        this.sendLog("session_start", {message: "Oturum basladi"});
    },

    sendLog: function (action, parameters) {
        const payload = {
            runKey: this.studentId,
            action: action,
            timestamp: Date.now(),
            parameters: parameters || {}
        };
        fetch(this.serverUrl, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        }).catch(function (err) {
            console.warn("[Logger] Gonderim hatasi:", err);
        });
    },

    setupCODAPListeners: function () {
        codapInterface.on("notify", "component", function (notice) {
            arborLogger.sendLog("codap_component_change", {
                operation: notice.values && notice.values.operation,
                type: notice.values && notice.values.type
            });
        });
        codapInterface.on("notify", "dataContextChangeNotice", function (notice) {
            arborLogger.sendLog("codap_data_change", {
                operation: notice.values && notice.values.operation,
                context: notice.resource
            });
        });
        codapInterface.on("notify", "dragDrop[attribute]", function (notice) {
            arborLogger.sendLog("codap_attribute_drag", {
                operation: notice.values && notice.values.operation,
                attribute: notice.values && notice.values.attribute && notice.values.attribute.name
            });
        });
        console.log("[Logger] CODAP dinleyicileri kuruldu");
    }
};
