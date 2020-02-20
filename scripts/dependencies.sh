#!/bin/sh
#2018 - Zylla / adde88@gmail.com

export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/sd/lib:/sd/usr/lib
export PATH=$PATH:/sd/usr/bin:/sd/usr/sbin

[[ -f /tmp/ManaToolkit.progress ]] && {
  exit 0
}

touch /tmp/ManaToolkit.progress
mkdir -p /tmp/ManaToolkit
wget https://github.com/adde88/hostapd-mana-openwrt/tree/openwrt-19.07/bin/ar71xx/packages/base -P /tmp/ManaToolkit
MANA=`grep -F "hostapd-mana_" /tmp/ManaToolkit/base | awk {'print $5'} | awk -F'"' {'print $2'}`
ASLEAP=`grep -F "asleap_" /tmp/ManaToolkit/base | awk {'print $5'} | awk -F'"' {'print $2'}`

if [ "$1" = "install" ]; then
  if [ "$2" = "internal" ]; then
    if [ -d /sd ]; then
      exit 0
    fi
	wget https://github.com/adde88/hostapd-mana-openwrt/raw/openwrt-19.07/bin/ar71xx/packages/base/"$ASLEAP" -P /tmp/ManaToolkit
	wget https://github.com/adde88/hostapd-mana-openwrt/raw/openwrt-19.07/bin/ar71xx/packages/base/"$MANA" -P /tmp/ManaToolkit
    opkg update
    opkg install /tmp/ManaToolkit/*.ipk  --force-overwrite
    #opkg install hostapd-mana 
  elif [ "$2" = "sd" ]; then
	wget https://github.com/adde88/hostapd-mana-openwrt/raw/openwrt-19.07/bin/ar71xx/packages/base/"$ASLEAP" -P /tmp/ManaToolkit
	wget https://github.com/adde88/hostapd-mana-openwrt/raw/openwrt-19.07/bin/ar71xx/packages/base/"$MANA" -P /tmp/ManaToolkit
    opkg update
    opkg install /tmp/ManaToolkit/*.ipk  --dest sd --force-overwrite
    #opkg install hostapd-mana  --dest sd
    [ ! -d "/etc/hostapd-mana" ] && ln -s /sd/etc/hostapd-mana /etc/hostapd-mana
  fi

  cp /etc/hostapd-mana/hostapd-mana.conf /etc/hostapd-mana/hostapd-mana.default.conf
  touch /etc/config/ManaToolkit
  echo "config ManaToolkit 'module'" > /etc/config/ManaToolkit
  echo "config ManaToolkit 'run'" >> /etc/config/ManaToolkit
  echo "config ManaToolkit 'autostart'" >> /etc/config/ManaToolkit

  uci set ManaToolkit.module.installed=1
  uci set ManaToolkit.autostart.interface=wlan1
  uci set ManaToolkit.autostart.upstream=br-lan
  uci set ManaToolkit.run.upstream=br-lan
  uci set ManaToolkit.run.interface=wlan1
  uci commit ManaToolkit

#  I'm commenting this stuff out, to minimize dependencies.
#  /etc/init.d/stunnel stop
#  /etc/init.d/stunnel disable

elif [ "$1" = "remove" ]; then
    opkg remove hostapd-mana asleap
    rm -rf /etc/config/ManaToolkit
fi

rm /tmp/ManaToolkit.progress
rm -rf /tmp/ManaToolkit
