var app = angular.module("myApp", ["ngRoute"]);
app.config(function ($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl: "agenda.html"
    })
    .when("/intro", {
        templateUrl: "intro.html"
    })
    .when("/problem", {
        templateUrl: "problem.html"
    })
    .when("/objective", {
        templateUrl: "objective.html"
    })
    .when("/options", {
        templateUrl: "options.html"
    })
    .when("/recommend", {
        templateUrl: "recommend.html"
    });
});
