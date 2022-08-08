## `chats`: 채팅 시 발생하는 이벤트 정리

Taxi의 채팅 기능은 Socket.IO 라이브러리를 이용해 구현되어 있습니다.
클라이언트에서의 일반적인 Socket.IO 사용법은 [공식 문서](https://socket.io/docs/v4/client-socket-instance/)를 참조해주세요.
아래와 같은 채팅 이벤트들이 구현되어 있습니다.

- `chats-join`
- `chats-receive`
- `chats-send`
- `chats-load`
- `chats-disconnected` (삭제해야 함)

서버로부터 받은 모든 채팅 기록은 아래와 같은 자료형으로 구성되어 있습니다.

```javascript
Chat {
  roomId: ObjectId, //방의 objectId
  type: String, // 메시지 종류("text": 일반 메시지, "in": 입장 메시지, "out": 퇴장 메시지", "s3img": S3에 업로드된 이미지
  authorId: ObejctId, //작성자의 objectId
  content: String, // 메시지 내용(메시지 종류에 따라 포맷이 상이하며, 하단 참조)
  time: String(ISO 8601), // ex) '2022-01-12T13:58:20.180Z'
  isValid: Boolean, // 클라이언트가 보낸 메시지가 유효한 지 여부. 클라이언트가 이미지를 업로드했을 때, 해당 이미지가 제대로 업로드됐는지 확인하기 전까지 이미지를 보여주지 않기 위해 사용됨.
}
```

### 1. `chats-join`

방에 새 사용자가 참여할 때 이 이벤트를 발생시키세요.  
필요한 인자는 `roomId`입니다.

- `roomId`: 방의 ObjectID (`String`), Socket.IO 서버와 연결을 시도할 때 사용자는 로그인이 되어 있어야 하며, 들어가려는 채팅방에 참여자로 참여하고 있어야 합니다.

```javascript
const socket = io(server_address, { withCredentials: true });
socket.emit("chats-join", roomId);
```

채팅방 접속이 정상적으로 완료되면, Socket.io 서버는 최근 30개의 메시지들(`Chat` 배열)을 전송합니다.

```javascript
socket.on("chats-join", (chats) => {
  // 최근 30개의 채팅 메시지 출력
  console.log(chats);
});
```

### 2. `chats-send`

채팅 메시지를 보낼 때 이 이벤트를 발생시키세요.
필요한 인자는 `roomId`와 `content`입니다.

- `roomId`: 참여중인 방의 ObjectID(`String`)
- `content`: 보낼 텍스트(`String`)

```javascript
socket.emit("chats-send", { roomId, content });
```

메시지 전송이 성공/실패하면, Socket.IO 서버도 `chats-send` 이벤트를 발생시킵니다.

```javascript
socket.on("chats-send", (response) => {
  // 최근 30개의 채팅 메시지 출력
  console.log(response);
});
```

`response`는 전송이 성공했을 경우 `{done: true}`, 실패했을 경우 `{err: true}`입니다.

### 3. `chats-receive`

이 이벤트는 서버나 다른 사용자가 채팅 메시지를 전송했을 때 발생합니다. 아래와 같이 `chat`에 접근하여 해당 메시지의 내용을 확인할 수 있습니다.

```javascript
socket.on("chats-receive", (chat) => {
  // 새로운 메시지 출력
  console.log(chat);
});
```

### 4. `chats-load`

과거 대화 목록을 더 불러오려면 이 이벤트를 발생시키세요. 필요한 인자는 `lastDate`와 `amount`(선택 사항) 입니다.

- `lastDate`: 현재 클라이언트에서 불러온 채팅들 중 가장 오래된 것의 생성 시각. 서버는 이보다 먼저 생성된 메시지들을 반환합니다. ISO8601을 만족하는 `String`이어야 합니다. e.g.) `"2022-03-15T13:57:04.732Z"`
- `amount` (선택 사항): 불러올 과거 메시지의 수. 1~50의 자연수여야 하며, 입력하지 않은 경우 30개의 메시지를 가져옵니다.

```javascript
socket.emit("chats-load", { lastDate: "2022-03-15T13:57:04.732Z", amount: 30 });
```

`chats-load` 이벤트가 발생하면 서버는 클라이언트에 다시 `chats-load` 이벤트를 발생시켜 과거 채팅들(`Chat` 배열)을 보냅니다.

```javascript
socket.on("chats-load", (chats) => {
  // 과거 메시지들 출력
  console.log(chats);
});
```
