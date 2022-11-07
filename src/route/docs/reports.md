## `/reports`

- 사용자 신고 및 신고 기록 조회 기능을 지원하는 API. 
- 로그인된 상태에서만 접근 가능
- report를 반환할 경우 그 type은 다음과 같다. 

```javascript
Report {
  creatorId: {
    _id: ObjectId, // 신고한 사용자 Document의 ObjectId
    id: String, // 신고한 사용자 id
    name: String, // 신고한 사용자 이름
    nickname: String, // 신고한 사용자 닉네임
    profileImageUrl: String, // 프로필 사진 url 
  },
  reportedId: {
    _id: ObjectId, // 신고당한 사용자 Document의 ObjectId
    id: String, // 신고당한 사용자 id
    name: String, // 신고당한 사용자 이름
    nickname: String, // 신고당한 사용자 닉네임
    profileImageUrl: String, // 프로필 사진 url 
  },
  type: String, // 신고 사유
  etcDetail: String, // 기타 세부 사유
  time: Date, // 신고 날짜
}
```

`type` 속성은 아래 세 가지 값들 중 하나를 가진다. 
1. `"no-settlement"` : 정산을 하지 않아서 신고
2. `"no-show"` : 방 참여 후 약속 장소에 오지 않아서 신고
3. `"etc-reason"` : 기타 사유로 신고

### `/create` **(POST)**

- 신고 작성함

#### URL Parameters, Request JSON form

- reportedId : 신고할 user의 ID
- type : 신고 사유 유형
- etcDetail: 기타 신고 사유 내용
- time : 신고 날짜

#### Response

- 200 "report successful"

#### Errors

- 500 "internal server error"



### `/searchByUser` **(GET)**

- 로그인된 사용자가 신고한 내역과, 신고받은 내역을 반환한다.
- 1000개의 limit이 있다. 

#### URL Parameters, Request JSON form

없음

#### Response

```javascript
{
  reporting: [Report], // 신고한 내역
  reported: [Report], // 신고받은 내역
}
```

#### Errors

- 500 "internal server error"
