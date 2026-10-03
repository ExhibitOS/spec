# 규격 검사 시작하기

[처음으로](../../README.md) · [Artwork](../../oes/v1/README.md) · [Exhibition/Lifecycle](../../oes/v1/exhibition.md) · [OEX](../../oex/v1/README.md) · [OED](../../oed/v1/README.md)

Node24.21.0/npm11.19.0에서 `npm ci --ignore-scripts` 후 사용합니다.
기본 CLI는 JSON을 stdout에 내고 성공0·실패1로 종료합니다. npm 명령은 실행
헤더를 추가하므로 자동화에서 JSON만 읽으려면 직접 Node 명령을 사용하세요.

| 검사 대상 | 실행 파일과 입력 |
| --- | --- |
| OES Artwork | `node validators/artwork-cli.mjs document.json [asset-root [publication-UTC-time]]` |
| 전시 revision | `node validators/exhibition-cli.mjs revision document.json [--assets directory] [--at UTC]` |
| draft/publication/freeze | 위 전시 CLI의 mode와 lifecycle 입력; [정확한 참조 인수](../../oes/v1/exhibition.md) |
| OEX | `node validators/package-cli.mjs oex file` |
| OED | `node validators/package-cli.mjs oed file` |
| identity adapter | `node validators/package-cli.mjs identity-adapter manifest.json target-version` |

```sh
node validators/artwork-cli.mjs --help
node validators/exhibition-cli.mjs --help
node validators/package-cli.mjs --help
node validators/package-cli.mjs --human oed oed/v1/examples/local.json
```

`--human`을 첫 인수로 넣으면 JSON은 그대로 유지하고 stderr에 복구 안내를
표시합니다. `--help`는 입력 파일을 검사하지 않고 사용법을 표시합니다.
두 옵션은 첫 인수 위치에만 쓰며 중복은 실패합니다. 파일명이 옵션과 같으면
`./--help` 또는 `./--human`처럼 경로 접두사를 사용하세요.

| 관찰한 문제 | 다음 확인 |
| --- | --- |
| 사용법 | `--help`의 mode·인수·참조 문서 순서 확인 |
| 파일 접근 | 읽기 권한과 파일 존재 확인; 원본을 보존하고 직접 재시도 |
| JSON 문법 | UTF-8과 JSON 문법을 별도 수정본에서 확인 |
| 크기 | 파일 크기·일반 파일 여부 확인; 입력 제한을 우회하지 않음 |
| 규격 오류 | JSON의 코드·필드 경로와 해당 wire 버전 확인 |

Package `0.1.0-draft.4`는 선택형 CLI 안내를 추가한 새 artifact 버전입니다.
OES/OED/OEX wire 버전과 schema bytes는 바꾸지 않습니다. 기존 무옵션 JSON
출력과 종료 코드는 유지하며 새 옵션 이름만 예약합니다. 기존 배포 artifact의
bytes와 consumer pin은 덮어쓰지 않습니다. 검증 통과가 실제 촬영 품질, 원본 권리
보증, 실제 서버 이미지·자격증명·복원·배포 준비를 증명하지는 않습니다.
