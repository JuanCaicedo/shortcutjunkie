'use strict';

// Shortcuts controller
angular.module('shortcuts').controller('ShortcutsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Shortcuts', 'Favorites', 'lodash', '$filter', '$http',
	function($scope, $stateParams, $location, Authentication, Shortcuts, Favorites, lodash, $filter, $http) {
		var _ = lodash;

		$scope.authentication = Authentication;
		$scope.user = Authentication.user;

		// Create new Shortcut
		$scope.create = function() {
			// Create new Shortcut object
			var shortcut = new Shortcuts({
				keyCombination: this.keyCombination,
				application: this.application,
				description: this.description,
				operatingSystem: this.operatingSystem,
				category: this.category
			});

			// Redirect after save
			shortcut.$save(function(response) {
				$location.path('shortcuts/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Shortcut
		$scope.remove = function(shortcut) {
			if (shortcut) {
				shortcut.$remove();

				for (var i in $scope.shortcuts) {
					if ($scope.shortcuts[i] === shortcut) {
						$scope.shortcuts.splice(i, 1);
					}
				}
			} else {
				$scope.shortcut.$remove(function() {
					$location.path('shortcuts');
				});
			}
		};

		// Update existing Shortcut
		$scope.update = function() {
			var shortcut = $scope.shortcut;

			shortcut.$update(function() {
				$location.path('shortcuts/' + shortcut._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find all possible applications
		$scope.findApplications = function() {
			$http.get('api/shortcuts?select=application')
				.success(function(data, status, headers, config) {
					$scope.applications = data;
				});
		};

		// Find a list of Shortcuts
		$scope.find = function() {
			$scope.shortcuts = Shortcuts.query({
				application: $scope.selectedApplication,
				favorites: $scope.displayFavorites
			});
			$scope.shortcuts.$promise
				.then(function() {
					// $scope.applications = $scope.shortcuts.reduce(function(previousValue, currentValue) {
					// 	if (previousValue.indexOf(currentValue.application) === -1) {
					// 		previousValue.push(currentValue.application);
					// 	}
					// 	return previousValue;
					// }, []);

					$scope.operatingSystems = $scope.shortcuts.reduce(function(previousValue, currentValue) {
						if (previousValue.indexOf(currentValue.operatingSystem) === -1) {
							previousValue.push(currentValue.operatingSystem);
						}
						return previousValue;
					}, []);

				})
				.then(function pickInitialOS() {
					var osCodes = {
						Win: 'Windows',
						Mac: 'OS X',
						X11: 'UNIX',
						Linux: 'Linux'
					};

					var initialOS;
					_.forEach(osCodes, function(os, code) {
						if (_.contains(navigator.appVersion, code)) {
							initialOS = os;
						}
					});

					if (_.contains($scope.operatingSystems, initialOS)) {
						$scope.selectedOS = initialOS;
					} else {
						$scope.selectedOS = $scope.operatingSystems[0];
					}
				});
		};

		// Find existing Shortcut
		$scope.findOne = function() {
			$scope.shortcut = Shortcuts.get({
				shortcutId: $stateParams.shortcutId
			});
		};

		$scope.selectedApplication = $stateParams.application;

		$scope.isEditor = function(user) {
			if (user.roles) {
				return user.roles.indexOf('editor') !== -1;
			} else {
				return false;
			}
		};

		$scope.toggleFavorite = function(shortcut) {
			if (!$scope.user) {
				return;
			}
			if (!$scope.isFavorite(shortcut)) {
				Favorites.save(shortcut, function(favorites) {
					$scope.user.favorites = favorites;
					shortcut.favoritesCount += 1;
				});
			} else {
				Favorites.remove({
					id: shortcut._id
				}, function(favorites) {
					$scope.user.favorites = favorites;
					shortcut.favoritesCount -= 1;
				});
			}
		};

		$scope.isFavorite = function(shortcut) {
			if (!$scope.user) return false;
			return $scope.user.favorites.indexOf(shortcut._id) !== -1;
		};

		$scope.view = function(shortcut) {
			$location.path('/shortcuts/' + shortcut._id);
		};

		$scope.$watch('shortcuts | operatingSystemFilter:selectedOS | groupBy:"application"',
			function(appGroups) {
				$scope.groupedShortcuts = {};
				angular.forEach(appGroups, function(shortcuts, app) {
					var categoryGroups = $filter('groupBy')(shortcuts, 'category');
					if (!_.isEmpty(categoryGroups)) {
						$scope.groupedShortcuts[app] = categoryGroups;
					}
				});
			}, true);
	}
]);