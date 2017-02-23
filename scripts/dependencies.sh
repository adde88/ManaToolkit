#!/bin/sh
#2017 - Zylla / adde88@gmail.com

export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/sd/lib:/sd/usr/lib
export PATH=$PATH:/sd/usr/bin:/sd/usr/sbin

[[ -f /tmp/ManaToolkit.progress ]] && {
  exit 0
}

touch /tmp/ManaToolkit.progress
mkdir -p /tmp/ManaToolkit

if [ -e /sd ]; then
	# sym-link, only for the pineapple nano.
	rm -r /usr/lib/python2.7
	mkdir -p /sd/usr/lib/python2.7
	ln -s /sd/usr/lib/python2.7 /usr/lib/python2.7
fi

if [ "$1" = "install" ]; then
  if [ "$2" = "internal" ]; then
	wget https://github.com/adde88/hostapd-mana-openwrt/raw/master/bin/ar71xx/packages/base/asleap_2.2-1_ar71xx.ipk -P /tmp/ManaToolkit
	wget https://github.com/adde88/hostapd-mana-openwrt/raw/master/bin/ar71xx/packages/base/hostapd-mana_2.6-1_ar71xx.ipk -P /tmp/ManaToolkit
    opkg update
    opkg install /tmp/ManaToolkit/*.ipk --force-overwrite
    #opkg install hostapd-mana asleap --force-overwrite
  elif [ "$2" = "sd" ]; then
	wget https://github.com/adde88/hostapd-mana-openwrt/raw/master/bin/ar71xx/packages/base/asleap_2.2-1_ar71xx.ipk -P /tmp/ManaToolkit
	wget https://github.com/adde88/hostapd-mana-openwrt/raw/master/bin/ar71xx/packages/base/hostapd-mana_2.6-1_ar71xx.ipk -P /tmp/ManaToolkit
    opkg update
    opkg install /tmp/ManaToolkit/*.ipk --dest sd --force-overwrite
    #opkg install hostapd-mana asleap --dest sd --force-overwrite
  fi

  touch /etc/config/ManaToolkit
  echo "config ManaToolkit 'module'" > /etc/config/ManaToolkit
  echo "config ManaToolkit 'run'" >> /etc/config/ManaToolkit
  echo "config ManaToolkit 'autostart'" >> /etc/config/ManaToolkit

  uci set ManaToolkit.module.installed=1
  uci commit ManaToolkit.module.installed

elif [ "$1" = "remove" ]; then
    opkg remove hostapd-mana asleap
    rm -rf /etc/config/ManaToolkit
fi

rm /tmp/ManaToolkit.progress
rm -rf /tmp/ManaToolkit

 if [[ -e /sd/etc/mana-toolkit && ! -e /etc/mana-toolkit ]]; then
        # sym-link, only for the pineapple nano.
        ln -s /sd/etc/mana-toolkit /etc/mana-toolkit
fi

