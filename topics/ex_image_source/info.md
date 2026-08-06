// 이미지 출처 예제 (테스트용)
// grid

# global
- 🧪 확인함 [ ]

# 1 그림 있음.png
- 그림이 공용 폴더 topics/images/ 에 있는 항목이다. 이것이 기본 형태다.
- 이 예제 전용 그림이라 다른 주제의 그림이 바뀌어도 영향을 받지 않는다.

# 2 그림 있음.png
- 위와 같다.

# 3 그림 있음.png
- 위와 같다. 여기까지가 상위 3개다.
- Poster(Insta)는 상위 3개만 쓰므로 이 상태에서는 안내창이 뜨면 안 된다.

# 4 그림 없음.svg
- 파일도 주소도 없다. 이름만 적힌 카드가 나와야 한다.

# 5 주소 CORS 미허용.jpg
- 그림 파일이 없고 주소만 있다. 이 호스트는 다른 사이트의 사용을 허용하지 않는다(BGG).
- 화면에는 보이지만 포스터에는 못 들어간다. 저장을 누르면 안내창이 떠야 한다.
- 화면용 썸네일과 포스터용 원본을 따로 적어 둔 항목이다. 안내창의 [Open image] 는 원본을 연다.
+ thumbnail-url: https://cf.geekdo-images.com/fUOKaaWYVnBagDKj4AQb2Q__itemrep/img/eYRdtO0y3v7z0wuCUrnds6QZjVs=/fit-in/246x300/filters:strip_icc()/pic8075053.jpg
+ podium-url: https://cf.geekdo-images.com/fUOKaaWYVnBagDKj4AQb2Q__original/img/hatQoun0oFaitZLGBDsJqDXbFTM=/0x0/filters:format(jpeg)/pic8075053.jpg

# 6 주소 CORS 허용.png
- 그림 파일이 없고 주소만 있는데, 이 호스트는 사용을 허용한다(raw.githubusercontent.com).
- 주제를 열면 자동으로 받아져 topics/images/ 에 저장된다. 다시 확인하려면 그 파일을 지우면 된다.
+ thumbnail-url: https://raw.githubusercontent.com/bluekms/rankmaker/main/topics/images/1%20%EA%B7%B8%EB%A6%BC%20%EC%9E%88%EC%9D%8C.png
