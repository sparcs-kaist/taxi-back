## `/chats`

- 채팅 목록을 불러오는 기능을 지원하는 API.
- 하나의 채팅 기록은 아래와 같이 구성되어 있음.

```javascript
Chat {
    author: String,
    text: String,
    time: Date,
}
```

### `/:roomId` **(GET)**

- 해당 번호에 해당하는 채팅방의 채팅 목록 제공.

#### URL Parameters

- roomId : 채팅방의 고유 번호
- page : 페이지 번호(0부터 시작)
- pageSize : 한 번에 불러올 채팅의 개수

#### Response

```javascript
{
    data: Chat[], // pageSize 개의 채팅 내역
    page: Number, // 페이지 번호
    totalPage: Number, //총 페이지 수(전체 채팅 수를 pageSize로 나눈 것)
    totalChats: Number, //총 채팅 개수
}
```

- 채팅 내역이 없는 경우, 아래와 같은 응답이 전송됨.

```javascript
{
    data: [],
    page: 0,
    totalPage: 0,
    totalChats: 0,
}
```

#### Errors

- 400 "wrong room id"
- 400 "Invalid page"
- 404 ""ID not exist"
- 500 "internal server error"
