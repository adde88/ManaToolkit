<?php namespace pineapple;
putenv('LD_LIBRARY_PATH='.getenv('LD_LIBRARY_PATH').':/sd/lib:/sd/usr/lib');
putenv('PATH='.getenv('PATH').':/sd/usr/bin:/sd/usr/sbin');

class ManaToolkit extends Module
{
	public function route()
    {
        switch ($this->request->action) {
			case 'refreshInfo':
				$this->refreshInfo();
				break;
			case 'refreshOutput':
                $this->refreshOutput();
                break;
            case 'refreshStatus':
                $this->refreshStatus();
                break;
            case 'toggleManaToolkit':
                $this->toggleManaToolkit();
                break;
            case 'handleDependencies':
                $this->handleDependencies();
                break;
            case 'handleDependenciesStatus':
                $this->handleDependenciesStatus();
                break;
            case 'refreshHistory':
                $this->refreshHistory();
                break;
            case 'viewHistory':
                $this->viewHistory();
                break;
            case 'deleteHistory':
                $this->deleteHistory();
                break;
			case 'downloadHistory':
					$this->downloadHistory();
				break;
			case 'toggleManaToolkitOnBoot':
				$this->toggleManaToolkitOnBoot();
				break;
			case 'getInterfaces':
				$this->getInterfaces();
				break;
			case 'saveAutostartSettings':
				$this->saveAutostartSettings();
				break;
            case 'getConfiguration':
                $this->getConfiguration();
                break;
            case 'saveConfiguration':
                $this->saveConfiguration();
                break;
            case 'restoreDefaultConfiguration':
                $this->restoreDefaultConfiguration();
                break;
			case 'getVersionInfo':
				$this->getVersionInfo();
				break;
			case 'getDHCPLeases':
				$this->getDHCPLeases();
				break;
			case 'getBlacklist':
				$this->getBlacklist();
				break;
			case 'getConnectedClients':
				$this->getConnectedClients();
				break;
			case 'removeMacAddress':
				$this->removeMacAddress();
				break;
			case 'addMacAddress':
				$this->addMacAddress();
				break;
			case 'disassociateMac':
				$this->disassociateMac();
				break;
			case 'deauthenticateMac':
				$this->deauthenticateMac();
				break;
        }
    }

		protected function checkDependency($dependencyName)
		{
			return ((exec("which hostapd-mana") == '' ? false : true) && ($this->uciGet("ManaToolkit.module.installed")));
		}

		protected function getDevice()
		{
			return trim(exec("cat /proc/cpuinfo | grep machine | awk -F: '{print $2}'"));
		}

		protected function refreshInfo()
		{
			$moduleInfo = @json_decode(file_get_contents("/pineapple/modules/ManaToolkit/module.info"));
			$this->response = array('title' => $moduleInfo->title, 'version' => $moduleInfo->version);
		}

    private function handleDependencies()
    {
		if(!$this->checkDependency("ManaToolkit"))
		{
			$this->execBackground("/pineapple/modules/ManaToolkit/scripts/dependencies.sh install ".$this->request->destination);
	        $this->response = array('success' => true);
		}
		else
		{
	        $this->execBackground("/pineapple/modules/ManaToolkit/scripts/dependencies.sh remove");
	        $this->response = array('success' => true);
		}
	}

    private function handleDependenciesStatus()
    {
        if (!file_exists('/tmp/ManaToolkit.progress'))
		{
            $this->response = array('success' => true);
        }
		else
		{
            $this->response = array('success' => false);
        }
    }

    private function toggleManaToolkitOnBoot()
    {
		if(exec("cat /etc/rc.local | grep ManaToolkit/scripts/autostart_ManaToolkit.sh") == "")
		{
			exec("sed -i '/exit 0/d' /etc/rc.local");
			exec("echo /pineapple/modules/ManaToolkit/scripts/autostart_ManaToolkit.sh >> /etc/rc.local");
			exec("echo exit 0 >> /etc/rc.local");
		}
		else
		{
			exec("sed -i '/ManaToolkit\/scripts\/autostart_ManaToolkit.sh/d' /etc/rc.local");
		}
	}

    private function toggleManaToolkit()
    {
		if(!$this->checkRunning("hostapd-mana"))
		{
			$this->uciSet("ManaToolkit.run.interface", $this->request->interface);
			$this->execBackground("/pineapple/modules/ManaToolkit/scripts/ManaToolkit.sh start");
		}
		else
		{
			$this->uciSet("ManaToolkit.run.interface", '');
			$this->execBackground("/pineapple/modules/ManaToolkit/scripts/ManaToolkit.sh stop");
		}
	}

	private function getInterfaces()
	{
		//exec("ip -o link show | awk '{print $2,$9}' | awk -F':' '{print $1}' | grep wlan | grep -v mon |  awk -F'-' '{print $1}' | uniq", $interfaceArray);
		exec("cat /proc/net/dev | tail -n +3 | cut -f1 -d: | sed 's/ //g' | grep wlan | grep -v mon | awk -F'-' '{print $1}' | uniq", $interfaceArray);
		$this->response = array("interfaces" => $interfaceArray, "selected" => $this->uciGet("ManaToolkit.run.interface"));
	}

    private function refreshStatus()
    {
        if (!file_exists('/tmp/ManaToolkit.progress'))
		{
			if (!$this->checkDependency("ManaToolkit"))
			{
				$installed = false;
				$install = "Not installed";
				$installLabel = "danger";
				$processing = false;

				$status = "Start";
				$statusLabel = "success";

				$bootLabelON = "default";
				$bootLabelOFF = "danger";
			}
			else
			{
				$installed = true;
				$install = "Installed";
				$installLabel = "success";
				$processing = false;

				if($this->checkRunning("ManaToolkit"))
				{
					$status = "Stop";
					$statusLabel = "danger";
				}
				else
				{
					$status = "Start";
					$statusLabel = "success";
				}

				if(exec("cat /etc/rc.local | grep ManaToolkit/scripts/autostart_ManaToolkit.sh") == "")
				{
					$bootLabelON = "default";
					$bootLabelOFF = "danger";
				}
				else
				{
					$bootLabelON = "success";
					$bootLabelOFF = "default";
				}
			}
        }
		else
		{
			$installed = false;
			$install = "Installing...";
			$installLabel = "warning";
			$processing = true;

			$status = "Not running";
			$statusLabel = "danger";
			$verbose = false;

			$bootLabelON = "default";
			$bootLabelOFF = "danger";
        }

			$device = $this->getDevice();
			$sdAvailable = $this->isSDAvailable();

		$this->response = array("device" => $device, "sdAvailable" => $sdAvailable, "status" => $status, "statusLabel" => $statusLabel, "installed" => $installed, "install" => $install, "installLabel" => $installLabel, "bootLabelON" => $bootLabelON, "bootLabelOFF" => $bootLabelOFF, "processing" => $processing);
	}

    private function refreshOutput()
    {
		if ($this->checkDependency("ManaToolkit"))
		{
			if ($this->checkRunning("ManaToolkit"))
			{
				$path = "/pineapple/modules/ManaToolkit/log";

				$latest_ctime = 0;
				$latest_filename = '';

				$d = dir($path);
				while (false !== ($entry = $d->read())) {
				  $filepath = "{$path}/{$entry}";
				  if (is_file($filepath) && filectime($filepath) > $latest_ctime) {
				      $latest_ctime = filectime($filepath);
				      $latest_filename = $entry;
				    }
				}

				if($latest_filename != "")
				{
					$log_date = gmdate("F d Y H:i:s", filemtime("/pineapple/modules/ManaToolkit/log/".$latest_filename));

					if ($this->request->filter != "")
					{
						$filter = $this->request->filter;

						$cmd = "cat /pineapple/modules/ManaToolkit/log/".$latest_filename." | ".$filter;
					}
					else
					{
						$cmd = "cat /pineapple/modules/ManaToolkit/log/".$latest_filename;
					}

					exec ($cmd, $output);
					if(!empty($output))
						$this->response = implode("\n", array_reverse($output));
					else
						$this->response = "Empty log...";
				}
			}
			else
			{
				 $this->response = "Mana Toolkit is not running...";
			}
		}
		else
		{
			$this->response = "Mana Toolkit is not installed...";
		}
    }

	private function refreshHistory()
	{
		$this->streamFunction = function () {
			$log_list = array_reverse(glob("/pineapple/modules/ManaToolkit/log/*"));

			echo '[';
			for($i=0;$i<count($log_list);$i++)
			{
				$info = explode("_", basename($log_list[$i]));
				$entryDate = gmdate('Y-m-d H-i-s', $info[1]);
				$entryName = basename($log_list[$i]);

				echo json_encode(array($entryDate, $entryName));

				if($i!=count($log_list)-1) echo ',';
			}
			echo ']';
		};
	}

	private function viewHistory()
	{
		$log_date = gmdate("F d Y H:i:s", filemtime("/pineapple/modules/ManaToolkit/log/".$this->request->file));
		exec ("cat /pineapple/modules/ManaToolkit/log/".$this->request->file, $output);

		if(!empty($output))
			$this->response = array("output" => implode("\n", $output), "date" => $log_date);
		else
			$this->response = array("output" => "Empty log...", "date" => $log_date);
	}

	private function deleteHistory()
	{
		exec("rm -rf /pineapple/modules/ManaToolkit/log/".$this->request->file);
	}

	private function downloadHistory()
	{
		$this->response = array("download" => $this->downloadFile("/pineapple/modules/ManaToolkit/log/".$this->request->file));
	}

	private function saveAutostartSettings()
	{
			$settings = $this->request->settings;
			$this->uciSet("ManaToolkit.autostart.interface", $settings->interface);
	}

    private function getConfiguration()
    {
        $config = file_get_contents('/etc/mana-toolkit/hostapd-mana.conf');
        $this->response = array("ManaToolkitConfiguration" => $config);
    }

    private function saveConfiguration()
    {
        $config = $this->request->ManaToolkitConfiguration;
        file_put_contents('/etc/mana-toolkit/hostapd-mana.conf', $config);
        $this->response = array("success" => true);
    }

    private function restoreDefaultConfiguration()
    {
        $defaultConfig = file_get_contents('/etc/mana-toolkit/hostapd-mana.default.conf');
        file_put_contents('/etc/mana-toolkit/hostapd-mana.conf', $defaultConfig);
        $this->response = array("success" => true);
    }

	private function getDHCPLeases() {
		exec("cat /tmp/dhcp-mana.leases", $dhcpleases);
		$this->response = array('dhcpleases' => $dhcpleases);		
	}

	private function getBlacklist() {
        $blacklist_file = file_get_contents('/etc/mana-toolkit/hostapd.deny');
        $this->response = array("blacklist" => $blacklist_file);
	}

	private function getConnectedClients() {
		exec("iw dev wlan0 station dump | grep Station | awk '{print $2}'", $wlan0clients);
		exec("iw dev wlan0-1 station dump | grep Station | awk '{print $2}'", $wlan01clients);
		exec("iw dev wlan1 station dump | grep Station | awk '{print $2}'", $wlan1clients);
		$this->response = array('wlan0clients' => $wlan0clients, 'wlan01clients' => $wlan01clients, 'wlan1clients' => $wlan1clients);
	}

	private function removeMacAddress() {
		exec("sed '/".$this->request->macAddress."/d' /etc/mana-toolkit/hostapd.deny", $removeMacResponse);
		$this->response = array('removeMacResponse' => $removeMacResponse);
	}

	private function addMacAddress() {
        $blacklist_mac = $this->request->macAddress;
        file_put_contents('/etc/mana-toolkit/hostapd.deny', $blacklist_mac);
        $this->response = array("success" => true);
	}

	private function disassociateMac() {
		exec('hostapd-mana_cli -p /var/run/hostapd-mana disassociate "'.$this->request->macAddress.'"', $disassociateResponse);
		$this->response = array('disassociateResponse' => $disassociateResponse);
	}

	private function deauthenticateMac() {
		exec('hostapd-mana_cli -p /var/run/hostapd-mana deauthenticate "'.$this->request->macAddress.'"', $deauthenticateResponse);
		$this->response = array('deauthSuccess' => 'Successful', 'deauthenticateResponse' => $deauthenticateResponse);
	}
}