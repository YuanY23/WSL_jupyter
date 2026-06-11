var createModal = function (id, title, body, footer) {
    var modal = $("<div/>")
        .addClass("modal")
        .addClass("fade")
        .attr("id", id)
        .attr("role", "dialog")

    var dialog = $("<div/>").addClass("modal-dialog");
    modal.append(dialog);

    var content = $("<div/>").addClass("modal-content");
    dialog.append(content);

    var header = $("<div/>").addClass("modal-header");
    content.append(header);
    header.append($("<button/>")
        .addClass("close")
        .attr("data-dismiss", "modal")
        .attr("aria-label", "关闭")
        .append($("<span/>")
            .attr("aria-hidden", "true")
            .html("&times;")));
    header.append($("<h4/>")
        .addClass("modal-title")
        .text(title));

    content.append($("<div/>").addClass("modal-body").append(body));

    if (!footer) {
        footer = $("<div/>");
        footer.append($("<button/>")
            .addClass("btn btn-primary close")
            .attr("type", "button")
            .attr("data-dismiss", "modal")
            .text("确定"));
    }
    content.append($("<div/>").addClass("modal-footer").append(footer));

    // remove the modal on close
    modal.on("hidden.bs.modal", function () {
        modal.remove();
    });

    $("body").append(modal);
    modal.modal();
    return modal;
};

var createLogModal = function (id, title, message, log, error) {
    var body = $("<div>");
    body.append($("<p/>").text(message));

    if (log) {
        var log_panel = $("<div/>").addClass("panel panel-warning");
        log_panel.append($("<div/>").addClass("panel-heading").text("日志输出"));
        log_panel.append($("<div/>")
            .addClass("panel-body")
            .append($("<pre/>").text(log)));
        body.append(log_panel);
    }

    if (error) {
        var err_panel = $("<div/>").addClass("panel panel-danger");
        err_panel.append($("<div/>").addClass("panel-heading").text("错误追踪"));
        err_panel.append($("<div/>")
            .addClass("panel-body")
            .append($("<pre/>").text(error)));
        body.append(err_panel);
    }

    return createModal(id, title, body);
};

var roundToPrecision = function (num, precision) {
    var factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
};

var insertDataTable = function (tbl) {
    tbl.DataTable({
        info: false,
        paging: false,
        saveState: true,
        language: {
            search: "搜索：",
            emptyTable: "表中无可用数据",
            zeroRecords: "未找到匹配记录",
            loadingRecords: "加载中...",
            processing: "处理中...",
            info: "显示第 _START_ 至 _END_ 项，共 _TOTAL_ 项",
            infoEmpty: "显示第 0 至 0 项，共 0 项",
            infoFiltered: "（由 _MAX_ 项筛选）",
            lengthMenu: "每页显示 _MENU_ 项",
            paginate: {
                first: "首页",
                previous: "上一页",
                next: "下一页",
                last: "末页"
            }
        },
        columnDefs: [{
            "targets": "no-sort",
            "orderable": false
        }]
    });
};

var linkTo = function (type, path) {
    /*
     * Connect a link in the appropriate manner for the context.
     * - If we're in the outermost frame, assume notebook and use an href.
     * - If we're in an iframe, assume lab and send a message.
     */
    if (window === window.top) {
        var prefix = {
            notebook: "/notebooks/",
            file: "/edit/",
            directory: "/tree/"
        }[type];

        return (_, el) => {
            return $(el)
                .attr("href", prefix + path)
                .attr("target", "_blank")[0];
        };
    } else {
        var command = {
            notebook: "docmanager:open",
            file: "docmanager:open",
            directory: "filebrowser:go-to-path",
        }[type];

        return (_, el) => {
            return $(el)
                .attr("href", "#")
                .click(() => {
                    window.parent.postMessage(
                        JSON.stringify({
                            "command": command,
                            "arguments": {"path": path}
                        }),
                        "*"
                    );
                })[0];
        }
    }
}
