## `/static`

- 프로필 사진 제공을 지원하는 API.

### `/user-profiles/:id` **(GET)**

특정 사용자의 프로필 사진을 제공함.

#### URL Parameters

- id : 프로필 사진을 조회할 사용자의 ID

#### Response

- 이미지 파일(mimetype: image)

#### Errors

- 404 "image not found"
- 503 "internal server error"
