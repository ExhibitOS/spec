// SPDX-License-Identifier: Apache-2.0
// Leading opt-in flags only. Existing argument parsing and JSON stay authoritative.
export function cliOptions(input) {
 const args=[...input];let human=false,help=false,invalid=false;
 while(args[0]==='--human'||args[0]==='--help'){
  const flag=args.shift();if(flag==='--human'){if(human)invalid=true;human=true;}else{if(help)invalid=true;help=true;}
 }
 if(help&&args.length)invalid=true;
 return {args,human,help,invalid};
}
export function diagnostic(human,stage,result){
 if(!human)return;
 const code=result?.errors?.[0]?.code;
 const message=result?.valid?'검사 통과. 실제 기기·품질·배포 준비 검증은 별도입니다.':
 code==='USAGE'||stage==='arguments'?'사용법을 확인하세요. --help로 인수 순서를 확인할 수 있습니다.':
 code==='DOCUMENT_LIMIT'||code==='INPUT_LIMIT'?'입력 크기와 일반 파일 여부를 확인하세요. 제한을 우회하지 마세요.':
 stage==='read'?'파일 접근과 읽기 상태를 확인하세요. 원본을 보존한 뒤 직접 다시 시도하세요.':
 stage==='parse'?'UTF-8과 JSON 문법을 확인하세요. 원본을 보존한 별도 수정본을 사용하세요.':
 'JSON 오류의 코드·필드 경로와 규격 버전을 확인하세요. 입력 값은 안내에 출력하지 않습니다.';
 console.error(message);
}
