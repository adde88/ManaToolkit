# Mana Toolkit - Module for the WiFi Pineapples  
## Early developer branch
This is a bleeding-edge ALPHA version of the Mana Toolkit "Module" for the WiFi Pineapples made by me. @adde88  
It should work, on both Pineapple NANO and TETRA.  But this is the dev. branch, so no promises!    
I would be very happy if people have suggestions, or just general feedback for improving the Module.   

Installation:
-----------------
TETRA:  
Create a folder: /pineapple/modules/ManaToolkit  
Copy all these files to that folder.  
Done.  
  
NANO:  
Create a folder: /sd/modules/ManaToolkit  
Copy all these files to that folder.  
You then need to sym-link that folder: ln -s /sd/modules/ManaToolkit /pineapple/modules/ManaToolkit  
Done.  

Disclaimer
-----------------
I did NOT make the MANA patches for hostapd! All creds. to Sensepost for that work!    
About this port: I drew inspiration from TarlogicSecurity, who successfully ported hostapd-wpe to OpenWRT.  
You do not need to touch this repo. to install anything! It's simply used as a source-repo. when building the whole thing.
