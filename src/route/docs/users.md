## `/users`

- **API 문서화 작업 진행 중**
- 사용자 조회 기능을 지원하는 API.
- 사용자를 반환할 경우 그 type은 다음과 같다.

```javascript
User {
    _id: String,
    name: String,
    nickname: String,
    id: String,
    withdraw: Boolean,
    ban: Boolean,
    joinat: Date,
    room: Array,
    profileImageUrl: String,
    subinfo: {
        kaist: String,
        sparcs: String,
        facebook: String,
        twitter: String,
    },
    __v: Number,
}
```

### `/` **(GET)** (for dev)

- 사용자 전체 리스트를 반환함.

#### URL Parameters

- 없음

#### Response

```javascript
{
    status: 200,
    data: User[] // 전체 사용자 리스트
}
```

#### Errors

- 없음

### `/rooms` **(GET)**

- 사용자의 방 리스트를 반환함.

#### URL Parameters

- id : User document의 id

#### Response

```javascript
{
    id: String // 요청된 id
    rooms: Room[] // 방 리스트
}
```

#### Errors

- 404 "user/rooms : such id does not exist"
- 500 "user/rooms : internal server error"

### `/:id` **(GET)**

- 사용자 정보를 반환함.

#### URL Parameters

- id : User document의 id

#### Response

```javascript
{
    status: 200,
    data: User, //id에 대응되는 사용자 정보
}
```

#### Errors

- 404 "user/:id : such id does not exist"
- 500 "user/:id : internal server error"

### `/:id/edit` **(POST)**

- 새 사용자 정보를 받아 업데이트함.

#### URL Parameters

- id : User document의 id

#### request JSON form

```javascript
User; //수정할 사용자 정보
```

#### Response

```javascript
{
    status: 200,
    data: "edit user successful",
}
```

#### Errors

- 400 "such id does not exist"

### `/:id/ban` **(GET)**

- 해당 사용자를 밴함.

#### URL Parameters

- id : User document의 id

#### Response

```javascript
{
    status: 200,
    data: "The user banned successfully",
}
```

#### Errors

- 400 "The user does not exist"
- 409 "The user is already banned"
- 500 "User/ban : Error 500"

### `/:id/unban` **(GET)**

- 해당 사용자를 밴 해제함.

#### URL Parameters

- id : User document의 id

#### Response

```javascript
{
    status: 200,
    data: "The user unbanned successfully",
}
```

#### Errors

- 400 "The user does not exist"
- 409 "The user is already banned"
- 500 "User/unban : Error 500"
