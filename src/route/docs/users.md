## `/users`

- 사용자 정보 조회 및 수정 기능을 지원하는 API.
- 로그인된 상태에서만 접근 가능
- 사용자를 반환할 경우 그 type은 다음과 같다.

```javascript
User {
    name: String,
    nickname: String, // 3글자 이상 25글자 이하로 구성되며 영어 대소문자, 한글, " ", 0~9, "-", "_" 으로만 이루어져야 함.
    id: String,
    profileImageUrl: String,
    room: [Room],
    withdraw: Boolean,
    ban: Boolean,
    joinat: Date,
    agreeOnTermsOfService: { type: Boolean, default: false }, //이용약관 동의 여부
    subinfo: {
        kaist: String,
        sparcs: String,
        facebook: String,
        twitter: String,
    },
    email: String,
    isAdmin: Boolean,
    __v: Number,
}
```

### `../middleware/auth` (Middleware)

- 로그인된 상태에서만 접근 가능
- API request 하자마자 실행됨

#### Response

```javascript
{
    userId: String
}
```

#### Errors

- 403 "not logged in"

### `/agreeOnTermsOfService` **(POST)**

- 이용 약관에 동의함 (철회 불가)

#### URL Parameters, Request JSON form

- 없음

#### Response

- 200 "agree on Terms of Service successful"

#### Errors

- 400 "already agreed"
- 500 "internal server error"

### `/getAgreeOnTermsOfService` **(GET)**

- 이용 약관 동의 여부를 가져옴

#### URL Parameters, Request JSON form

- 없음

#### Response

```javascript
{
    status: 200,
    agreeOnTermsOfService: Boolean
},
```

#### Errors

- 500 "internal server error"

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
(새로운 nickname의 공백을 변환하면 정규식을 만족하지 못할 때에도 500 에러를 반환)

### `/editProfileImg/getPUrl` **(POST)**

- 프로필 이미지를 업로드할 수 있는 Presigned-url을 발급합니다.
- 프로필 사진은 아래 규칙을 만족해야 함.
  1. 파일 형식은 image/png, image/jpg, image/jpeg 중 하나
  2. 파일 크기는 최대 50 MB

#### URL Parameters

- 없음

#### request JSON form

```javascript
{
    type : String // 업로드할 이미지 type
}
```

#### Response

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
