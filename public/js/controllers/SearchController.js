angular.module('sj').controller('searchController', ['$scope', '$http', '$timeout',
    function ShortcutController($scope, $http, $timeout) {

    	$http.get('/api/search/initial').success(function(data, status, headers, config){
    		$scope.searchChoices = data.searchChoices;
    	})

    	$scope.searchType = 'no choice selected';
    }
]);