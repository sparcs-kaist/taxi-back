const loginPage = `
<!DOCTYPE html>
<html lang="ko">
    <head>
        <title>replace Login</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0,minium-scale=1.0,maxinum-scale=1.0,user-scalable=no" />
        <script src="https://code.jquery.com/jquery-latest.min.js"></script>
        <script>
            $(document).ready(function(){
                const post = (path, params) => {
                    var form = document.createElement("form");
                    form.setAttribute("method", "post");
                    form.setAttribute("action", path);
                    for(var key in params) {
                        var hiddenField = document.createElement("input");
                        hiddenField.setAttribute("type", "hidden");
                        hiddenField.setAttribute("name", key);
                        hiddenField.setAttribute("value", params[key]);
                        form.appendChild(hiddenField);
                    }
                    document.body.appendChild(form);
                    form.submit();
                }
                const submitHandler = () => {
                    const value = document.getElementById("input-id").value;
                    if(value) post('/api/auth/login/replace', {
                      id: value,
                    });
                }
                const enterHandler = (e) => {
                    if (e.keyCode === 13) submitHandler();
                }
                $('#btn').click(submitHandler);
                $('#input-id').on("keyup", enterHandler);
                $('#input-id').focus();
            });
        </script>
    </head>
    <body>
        <div>아이디 입력</div>
        <input id="input-id">
        <div id="btn">로그인</div>
    </body>
</html>
`;

export default loginPage;
