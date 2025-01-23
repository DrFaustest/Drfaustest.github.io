
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Rock Paper Scissors</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    

<header>
    <h1>Rock Paper Scissors</h1>
</header>
<div class="score-board">
    <div id="user-label" class="badge">User</div>
    <span id="user-score" class="score">0</span>
    <span id="computer-score" class="score">0</span>
    <div id="computer-label" class="badge">Comp</div>
</div>

<div class="result">
    <p>Paper covers rock you win</p>
</div>
<div class="choices">
<div id="r" class="choice"><img src="rock.png" alt="rock"></div>
<div id="p" class="choice"><img src="paper.png" alt="paper"></div>
<div id="s" class="choice"><img src="scissors.png" alt="scissors"></div>
</div>
<div id="action-message"><p>Make yor move</p></div>



<script src="js/web_file.js"></script>
</body>
</html>



function playGame($userChoice, $computerChoice, $winner) {
    global $score;
    global $games;
    global $userChoice;
    global $computerChoice;
    global $winner;
    $games++;
    $score[$winner]++;
    echo "<div id='userChoice'>User's Choice: " . $userChoice . "</div>";
    echo "<div id='computerChoice'>Computer's Choice: " . $computerChoice . "</div>";
    echo "<div id='winner'>Winner: " . $winner . "</div>";
    echo "<div id='score'>Score: User: " . $score["user"] . " Computer: " . $score["computer"] . " Ties: " . $score["ties"] . " Games: " . $games . "</div>";
}