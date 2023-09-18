const emailPage = require("./emailPage");

module.exports = (origin, name, nickname, roomName, payer, roomId) =>
  emailPage(
    "미정산 내역 관련 안내",
    `<b><font color="#6E3678">${name} (${nickname})</font></b> 님께<br /><br />
    안녕하세요, ${name} (${nickname}) 님.<br />
    KAIST 학부 총학생회 산하 특별기구 SPARCS의 Taxi 팀입니다.<br /><br />
    최근 참여하신 방에서 정산이 이루어지지 않았다는 사용자의 문의가 접수되어 메일을 보내드립니다.<br /><br />
    <div style="background: #EEEEEE; border-radius: 20px; margin: padding: 16px 24px; padding: 16px 24px; ">
      <div style="margin: 0; padding: 0;">
        <span style="width: 64px; display: inline-block;"><b>방 제목</b></span>
        ${roomName}
      </div>
      <div style="margin: 0; padding: 0;">
        <span style="width: 64px; display: inline-block;"><b>결제자</b></span>
        ${payer}
      </div>
      <div style="margin: 0; padding: 0;">
        <span style="width: 64px; display: inline-block;"><b>링크</b></span>
        <a href="${
          new URL(`/myroom/${roomId}`, origin).href
        }" target="_blank">${new URL(`/myroom/${roomId}`, origin).href}</a>
      </div>
    </div><br />
    위 방에서 채팅을 확인하실 수 있으며, <b>결제하신 분께 해당 금액을 정산</b>해주시기를 부탁드립니다.<br />
    <b>미정산이 반복되는 경우 Taxi 서비스 이용이 제한</b>될 수 있음을 알려드립니다.<br />
    문의가 필요하신 경우, <a href="${
      new URL("/mypage", origin).href
    }" target="_blank">택시 서비스 내부</a>의 &quot;채널톡 문의하기&quot; 혹은 메일 회신 주시면 됩니다.<br /><br />
    감사합니다.<br />
    SPARCS Taxi팀 드림.
    `
  );
