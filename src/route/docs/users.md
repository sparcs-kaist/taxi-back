## `/users`

- 사용자 정보 조회 및 수정 기능을 지원하는 API.
- 로그인된 상태에서만 접근 가능
- 사용자를 반환할 경우 그 type은 다음과 같다.

```javascript
User {
    name: String,
    nickname: String, // 3글자 이상 25글자 이하로 구성되며 영어 대소문자, 한글, " ", 0~9, "-", "_" 으로만 이루어져야 함.
    id: String,
    withdraw: Boolean,
    ban: Boolean,
    joinat: Date,
    agreeOnTermsOfService: { type: Boolean, default: false }, //이용약관 동의 여부
    room: [Room],
    subinfo: {
        kaist: String,
        sparcs: String,
        facebook: String,
        twitter: String,
    },
    email: String,
    __v: Number,
}
```

### `/agreeOnTermsOfService` **(POST)**

- 이용 약관에 동의함 (철회 불가)

#### URL Parameters, Request JSON form

- 없음

#### Response

- 200 "agree on Terms of Service successful"
- 400 "already agreed"
- 500 "internal server error"

### `/getAgreeOnTermsOfService` **(GET)**

- 이용 약관 동의 여부를 가져옴

#### URL Parameters, Request JSON form

- 없음

#### Response

```javascript
{
    agreeOnTermsOfService: Boolean
},
```

### `/editNickname` **(POST)**

- 해당 사용자의 닉네임을 새로 설정함.
- 새로운 닉네임은 상술한 규칙을 만족해야 함.

#### URL Parameters

- user_id : 사용자의 SPARCS SSO ID

#### request JSON form

```javascript
{
    nickname: String, // 새 닉네임
}
```

#### Response

```javascript
{
    status: 200,
    data: "edit user nickname successful",
}
```

#### Errors

- 400 "wrong nickname"
- 400 "such user id does not exist"
- 403 "not logged in"
- 500 "internal server error"

### `/editProfileImg/getPUrl` **(POST)**

- 프로필 이미지를 업로드할 수 있는 Presigned-url을 발급합니다.
- 프로필 사진은 아래 규칙을 만족해야 함.
  1. 파일 형식은 image/png, image/jpg, image/jpeg 중 하나
  2. 파일 크기는 최대 50 MB

#### URL Parameters

- type : 업로드할 이미지 type

#### request JSON form

```javascript
{
    url: String, // pre-signed url
    fields: Object, // post fields
}
```

#### Errors

- 500 "internal server error"

### `/editProfileImg/done` **(GET)**

- 프로필 이미지가 S3에 정상적으로 업로드가 되었는지 확인합니다.

#### URL Parameters

- 없음

#### request JSON form

```javascript
{
    result: Boolean, // 정상적으로 업로드 되었으면 true
    profileImageUrl?: user._id, // 정상적으로 업로드 되었으면 새 프로필 이미지 파일명, 그렇지 않은 경우 undefined
}
```

#### Errors

- 500 "internal server error"

### `/` **(GET)** (for dev)

- 사용자 전체 리스트를 반환함.

#### URL Parameters

- 없음

#### Response

```javascript
{
    status: 200,
    data: User[], // 전체 사용자 리스트
}
```

#### Errors

- 없음

### `/rooms` **(GET)** (for dev)

- 사용자의 방 리스트를 반환함.

#### URL Parameters

- id : User document의 id

#### Response

```javascript
{
    id: String, // 요청된 id
    rooms: Room[], // 방 리스트
}
```

#### Errors

- 404 "user/rooms : such id does not exist"
- 500 "user/rooms : internal server error"

### `/:id` **(GET)** (for dev)

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

### `/:id/edit` **(POST)** (for dev)

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

### `/:id/ban` **(GET)** (for dev)

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

### `/:id/unban` **(GET)** (for dev)

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

### `/:id/participate` **(POST)** (for dev)

- 해당 사용자를 특정 방에 참여시킴.

#### URL Parameters

- id : User document의 id

#### request JSON form

```javascript
{
    room: String, // Room document의 id
}
```

#### Response

```javascript
{
    status: 200,
    data: "User/participate : Successful",
}
```

#### Errors

- 400 "User/participate : Bad request"
- 400 "User/participate : No corresponding room"
- 400 "The user does not exist"
- 409 "The user already entered the room"
- 500 "User/participate : Error 500"
