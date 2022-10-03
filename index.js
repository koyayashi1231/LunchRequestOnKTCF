const slackHookURL = "SLACK INCOMING WEB HOOK's URL";

jQuery.prototype.offsetCenter = function () {
  let left = this.offset().left;
  let top = this.offset().top;
  let width = this.width();
  let height = this.height();
  let x = Math.round(left + width / 2);
  let y = Math.round(top + height / 2);
  return { x, y };
};

jQuery.prototype.contain = function (position) {
  let left = this.offset().left;
  let top = this.offset().top;
  let width = this.width();
  let height = this.height();
  return (
    left <= position.x &&
    position.x <= left + width &&
    top <= position.y &&
    position.y <= top + height
  );
};

function sendToSlack(data) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", slackHookURL, false);
  xhr.send(JSON.stringify(data));
}

function orderList() {
  let data = {
    type: "section",
    blocks: [
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_list",
            style: "bullet",
            elements: [],
          },
        ],
      },
    ],
  };

  $(".menu").each(function (idx_m, ele_m) {
    let num = 0;
    $(".piece").each(function (idx_p, ele_p) {
      if ($(ele_m).contain($(ele_p).offsetCenter())) {
        num += 1;
      }
    });
    if (0 < num) {
      let txt = $(ele_m).html() + ": " + num;
      data.blocks[0].elements[0].elements.push({
        type: "rich_text_section",
        elements: [
          {
            type: "text",
            text: txt,
          },
        ],
      });
    }
  });

  return data;
}

function getNow() {
  var now = new Date();
  var hour = ("00" + now.getHours()).slice(-2);
  var min = ("00" + now.getMinutes()).slice(-2);
  var sec = ("00" + now.getSeconds()).slice(-2);
  return hour + ":" + min + "." + sec;
}

$(() => {
  setInterval(() => {
    let now = getNow();
    $("#clock").html(now);
    if ("11:00.00" == now) {
      sendToSlack(orderList());
      window.close();
    }
  }, 500);

  $("#forceEnd").click(() => {
    sendToSlack(orderList());
    window.close();
  });

  let frame = $("body");
  $(".piece").on("grab", function (event) {
    if (0 != event.detail.index || $(this).hasClass("grabNow")) {
      return;
    }
    $(this).addClass("grabNow");
    var img_offset_x =
      parseInt(event.detail.x) - parseInt($(this).offset().left);
    var img_offset_y =
      parseInt(event.detail.y) - parseInt($(this).offset().top);
    var max_top = frame.height() - $(this).height();
    var max_left = frame.width() - $(this).width();
    $(this).data({
      pid: event.detail.pid,
      frame_offset_x: parseInt(frame.offset().left),
      frame_offset_y: parseInt(frame.offset().top),
      img_offset_x: img_offset_x,
      img_offset_y: img_offset_y,
      max_top: max_top,
      max_left: max_left,
    });
  });

  $("body").on("drop", function (event) {
    removeGrabNow(event.detail.pid);
  });

  $(document).on("lost", function (event) {
    removeGrabNow(event.detail.pid);
  });

  function removeGrabNow(pid) {
    $(".piece.grabNow").each(function (idx, ele) {
      if (pid == $(ele).data("pid")) {
        $(ele).removeClass("grabNow");
      }
    });
  }

  $(document).on("grabMove", function (event) {
    $(".piece.grabNow").each(function (idx, ele) {
      if (event.detail.pid == $(ele).data("pid")) {
        var top =
          parseInt(event.detail.y) -
          $(ele).data("frame_offset_y") -
          $(ele).data("img_offset_y");
        var left =
          parseInt(event.detail.x) -
          $(ele).data("frame_offset_x") -
          $(ele).data("img_offset_x");
        if ($(ele).data("max_top") < top) {
          top = $(ele).data("max_top");
        }
        if (top < 0) {
          top = 0;
        }
        if ($(ele).data("max_left") < left) {
          left = $(ele).data("max_left");
        }
        if (left < 0) {
          left = 0;
        }
        $(ele).css("top", top);
        $(ele).css("left", left);
      }
    });
  });
});
