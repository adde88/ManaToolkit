#!/bin/sh
#2017 - Zylla / adde88@gmail.com

export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/sd/lib:/sd/usr/lib
export PATH=$PATH:/sd/usr/bin:/sd/usr/sbin

MYTIME=`date +%s`
MYINTERFACE=`uci get ManaToolkit.run.interface`

if [ "$1" = "start" ]; then
	launch-mana ${MYINTERFACE} > /pineapple/modules/ManaToolkit/log/output_${MYTIME}.log
elif [ "$1" = "stop" ]; then
	killall -9 launch-mana
	killall -9 hostapd-mana
	killall -9 sslsplit 
	killall -9 python
fi
