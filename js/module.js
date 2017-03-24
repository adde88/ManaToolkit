registerController('ManaToolkit_Controller', ['$api', '$scope', '$rootScope', '$interval', '$timeout', function($api, $scope, $rootScope, $interval, $timeout) {
	$scope.title = "Loading...";
	$scope.version = "Loading...";

  $scope.refreshInfo = (function() {
		$api.request({
            module: 'ManaToolkit',
            action: "refreshInfo"
        }, function(response) {
						$scope.title = response.title;
						$scope.version = "v"+response.version;
        })
    });

		$scope.refreshInfo();

}]);

registerController('ManaToolkit_ControlsController', ['$api', '$scope', '$rootScope', '$interval', '$timeout', function($api, $scope, $rootScope, $interval, $timeout) {
	$scope.status = "Loading...";
	$scope.statusLabel = "default";
	$scope.starting = false;

	$scope.install = "Loading...";
	$scope.installLabel = "default";
	$scope.processing = false;

	$scope.bootLabelON = "default";
	$scope.bootLabelOFF = "default";

	$scope.interfaces = [];
	$scope.selectedInterface = "";

	$scope.saveSettingsLabel = "default";

	$scope.device = '';
	$scope.sdAvailable = false;

	$rootScope.status = {
		installed : false,
		refreshOutput : false,
		refreshHistory : false
	};

  $scope.refreshStatus = (function() {
		$api.request({
            module: "ManaToolkit",
            action: "refreshStatus"
        }, function(response) {
            $scope.status = response.status;
						$scope.statusLabel = response.statusLabel;

						$rootScope.status.installed = response.installed;
						$scope.device = response.device;
						$scope.sdAvailable = response.sdAvailable;
						if(response.processing) $scope.processing = true;
						$scope.install = response.install;
						$scope.installLabel = response.installLabel;

						$scope.bootLabelON = response.bootLabelON;
						$scope.bootLabelOFF = response.bootLabelOFF;
        })
    });

  $scope.toggleManaToolkit = (function() {
		if($scope.status != "Stop")
			$scope.status = "Starting...";
		else
			$scope.status = "Stopping...";

		$scope.statusLabel = "warning";
		$scope.starting = true;

		$rootScope.status.refreshOutput = false;
		$rootScope.status.refreshHistory = false;

		$api.request({
            module: 'ManaToolkit',
            action: 'toggleManaToolkit',
						interface: $scope.selectedInterface
        }, function(response) {
            $timeout(function(){
							$rootScope.status.refreshOutput = true;
							$rootScope.status.refreshHistory = true;

	            $scope.starting = false;
				$scope.refreshStatus();
            }, 2000);
        })
    });

	$scope.saveAutostartSettings = (function() {
		$api.request({
						module: 'ManaToolkit',
						action: 'saveAutostartSettings',
						settings: { interface : $scope.selectedInterface }
				}, function(response) {
					$scope.saveSettingsLabel = "success";
					$timeout(function(){
							$scope.saveSettingsLabel = "default";
					}, 2000);
				})
		});

  $scope.toggleManaToolkitOnBoot = (function() {
    if($scope.bootLabelON == "default")
		{
			$scope.bootLabelON = "success";
			$scope.bootLabelOFF = "default";
		}
		else
		{
			$scope.bootLabelON = "default";
			$scope.bootLabelOFF = "danger";
		}

		$api.request({
            module: 'ManaToolkit',
            action: 'toggleManaToolkitOnBoot',
        }, function(response) {
			$scope.refreshStatus();
        })
    });

  $scope.handleDependencies = (function(param) {
    if(!$rootScope.status.installed)
			$scope.install = "Installing...";
		else
			$scope.install = "Removing...";

		$api.request({
            module: 'ManaToolkit',
            action: 'handleDependencies',
						destination: param
        }, function(response){
            if (response.success === true) {
				$scope.installLabel = "warning";
				$scope.processing = true;

                $scope.handleDependenciesInterval = $interval(function(){
                    $api.request({
                        module: 'ManaToolkit',
                        action: 'handleDependenciesStatus'
                    }, function(response) {
                        if (response.success === true){
                            $scope.processing = false;
                            $interval.cancel($scope.handleDependenciesInterval);
                            $scope.refreshStatus();
                        }
                    });
                }, 5000);
            }
        });
    });

	$scope.getInterfaces = (function() {
		$api.request({
						module: 'ManaToolkit',
						action: 'getInterfaces'
				}, function(response) {
						$scope.interfaces = response.interfaces;
						if(response.selected != "")
							$scope.selectedInterface = response.selected;
						else
							$scope.selectedInterface = $scope.interfaces[0];
				});
		});

	$scope.refreshStatus();
	$scope.getInterfaces();
}]);

registerController('ManaToolkit_OutputController', ['$api', '$scope', '$rootScope', '$interval', function($api, $scope, $rootScope,$interval) {
    $scope.output = 'Loading...';
	$scope.filter = '';

	$scope.refreshLabelON = "default";
	$scope.refreshLabelOFF = "danger";

    $scope.refreshOutput = (function() {
		$api.request({
            module: "ManaToolkit",
            action: "refreshOutput",
			filter: $scope.filter
        }, function(response) {
            $scope.output = response;
        })
    });

    $scope.clearFilter = (function() {
        $scope.filter = '';
        $scope.refreshOutput();
    });

    $scope.toggleAutoRefresh = (function() {
        if($scope.autoRefreshInterval)
		{
			$interval.cancel($scope.autoRefreshInterval);
			$scope.autoRefreshInterval = null;
			$scope.refreshLabelON = "default";
			$scope.refreshLabelOFF = "danger";
		}
		else
		{
			$scope.refreshLabelON = "success";
			$scope.refreshLabelOFF = "default";

			$scope.autoRefreshInterval = $interval(function(){
				$scope.refreshOutput();
	        }, 5000);
		}
    });

    $scope.refreshOutput();

		$rootScope.$watch('status.refreshOutput', function(param) {
			if(param) {
				$scope.refreshOutput();
			}
		});

}]);

registerController('ManaToolkit_LogController', ['$api', '$scope', '$rootScope', '$filter', function($api, $scope, $rootScope, $filter) {
	$scope.files = [];
	$scope.selectedFiles = {};
	$scope.selectedFilesArray = [];
	$scope.selectedAll = false;
	$scope.fileOutput = 'Loading...';
	$scope.fileDate = 'Loading...';
	$scope.fileName = 'Loading...';

	$scope.updateSelectedFiles = (function() {
		$scope.selectedFilesArray = [];
		angular.forEach($scope.selectedFiles, function(key,value) { if(key) { $scope.selectedFilesArray.push(value); } });
	});

	$scope.updateAllSelectedFiles = (function() {
		$scope.selectedFilesArray = [];
		if($scope.selectedAll)
		{
			angular.forEach($scope.files, function(key,value) { $scope.selectedFilesArray.push(key.path); $scope.selectedFiles[key.path] = true; });
			$scope.selectedAll = true;
		}
		else
		{
			$scope.selectedAll = false;
			$scope.selectedFiles = {};
		}
	});

  $scope.refreshFilesList = (function() {
      $api.request({
          module: "ManaToolkit",
          action: "refreshFilesList"
      }, function(response) {
			$scope.files = response.files;
      })
  });

	$scope.downloadFilesList = (function() {
		$api.request({
        module: "ManaToolkit",
        action: "downloadFilesList",
		files: $scope.selectedFilesArray
    }, function(response) {
			if (response.error === undefined) {
				window.location = '/api/?download=' + response.download;
			}
    })
  });

	$scope.deleteFilesList = (function() {
		$api.request({
        module: "ManaToolkit",
        action: "deleteFilesList",
		files: $scope.selectedFilesArray
    }, function(response) {
			$scope.refreshFilesList();
			$scope.selectedFiles = {};
			$scope.updateSelectedFiles();
    })
  });

  $scope.viewFile = (function(param) {
	$api.request({
        module: "ManaToolkit",
        action: "viewModuleFile",
		file: param
      }, function(response) {
        	$scope.fileOutput = response.output;
			$scope.fileDate = response.date;
			$scope.fileName = response.name;
      })
  });

  $scope.deleteFile = (function(param) {
	$api.request({
        	module: "ManaToolkit",
        	action: "deleteModuleFile",
			file: param
      }, function(response) {
        	$scope.refreshFilesList();
      })
  });

	$scope.downloadFile = (function(param) {
			$api.request({
            	module: 'ManaToolkit',
            	action: 'downloadModuleFile',
				file: param
        }, function(response) {
            if (response.error === undefined) {
                window.location = '/api/?download=' + response.download;
            }
        });
    });

	$scope.refreshFilesList();

}]);

registerController('ManaToolkit_ConfigController', ['$api', '$scope', '$timeout', function($api, $scope, $timeout) {
    $scope.ManaToolkitConfiguration = "";

    $scope.getConfiguration = (function() {
        $api.request({
            module: 'ManaToolkit',
            action: 'getConfiguration'
        }, function(response) {
            console.log(response);
            if (response.error === undefined){
                $scope.ManaToolkitConfiguration = response.ManaToolkitConfiguration;
            }
        });
    });

    $scope.saveConfiguration = (function() {
        $api.request({
            module: 'ManaToolkit',
            action: 'saveConfiguration',
            ManaToolkitConfiguration: $scope.ManaToolkitConfiguration
        }, function(response) {
            console.log(response);
            if (response.success === true){
                $scope.getConfiguration();
            }
        });
    });

    $scope.restoreDefaultConfiguration = (function() {
        $api.request({
            module: 'ManaToolkit',
            action: 'restoreDefaultConfiguration'
        }, function(response) {
            if (response.success === true) {
                $scope.getConfiguration();
            }
        });
    });

    $scope.getConfiguration();
}]);

registerController('ManaToolkit_ClientsController', ['$api', '$scope', function($api, $scope) {
	$scope.clientslength = 0;
	$scope.wlan1clients = [];
	$scope.dhcplength = 0;
	$scope.dhcpleases = [];
	$scope.blacklistlength = 0;
	$scope.blacklist = [];

	// this function gets the connected clients information and fills in the panel
	$scope.getConnectedClients = (function() {
		$api.request({
			module: 'ManaToolkit',
			action: 'getConnectedClients'
		}, function(response) {
			$scope.clientslength = response.wlan1clients.length;
			$scope.wlan1clients = response.wlan1clients;
		});
	});

	// this function adds a mac address to the blacklist
	$scope.addMacAddress = (function(macAddress) {
		$api.request({
			module: 'ManaToolkit',
			action: 'addMacAddress',
			macAddress: macAddress
		}, function(response) {
			$scope.getBlacklist();
		});
	});

	// this function gets the DHCP leases from the file system and fills in the panel
	$scope.getDHCPLeases = (function() {
		$api.request({
			module: 'ManaToolkit',
			action: 'getDHCPLeases'
		}, function(response) {
			$scope.dhcplength = response.dhcpleases.length;
			$dhcp = response.dhcpleases;
			for (var i = $scope.dhcplength - 1; i >= 0; i--) {
				$dhcp[i] = $dhcp[i].split(' ');
			}
			$scope.dhcpleases = $dhcp;
		});
	});

	// this function removes a MAC address from the blacklist
	$scope.removeMacAddress = (function(macAddress) {
		$api.request({
			module: 'ManaToolkit',
			action: 'removeMacAddress',
			macAddress: macAddress
		}, function(response) {
			$scope.getBlacklist();
		});
	});

	// this function retrieves the blacklist and fills it in on the panel
	$scope.getBlacklist = (function() {
		$api.request({
			module: 'ManaToolkit',
			action: 'getBlacklist'
		}, function(response) {
			$scope.blacklistlength = response.blacklist.length;
			$scope.blacklist = response.blacklist;
		});
	});

	// this function disassociates a MAC address
	$scope.disassociateMac = (function(macAddress) {
		$api.request({
			module: 'ManaToolkit',
			action: 'disassociateMac',
			macAddress: macAddress
		}, function(response) {
			$scope.getConnectedClients();
		});
	});

	// this function deauthenticates a MAC address
	$scope.deauthenticateMac = (function(macAddress) {
		$api.request({
			module: 'ManaToolkit',
			action: 'deauthenticateMac',
			macAddress: macAddress
		}, function(response) {
			$scope.getConnectedClients();
		});
	});

	// initialize the panels
	$scope.getBlacklist();
	$scope.getConnectedClients();
	$scope.getDHCPLeases();
}]);