$(document).ready(function () {
    $("#flipIntro").click(function () {
        $("#panelIntro").slideToggle("slow");
    });
    $("#flipProblem").click(function () {
        $("#panelProblem").slideToggle("slow");
    });
    $("#flipPurpose").click(function () {
        $("#panelPurpose").slideToggle("slow");
    });
    $("#flipRecommendation").click(function () {
        $("#panelRecommendation").slideToggle("slow");
    });
    $("#flipConclude").click(function () {
        $("#panelConclude").slideToggle("slow");
    });
});