# VSCode Network Tools

The goal of this extension is to provide a set useful tools for anyone that needs to analyze the network. Tested and optimized for large files.


## Features

* PCAP and PCAPNG file viewer with parsers for the following protocols:
    * Ethernet II
    * SLL2
    * Raw IP
    * 802.1Q VLAN
    * PPPoE
    * ARP
    * IPv4
    * IPv6
    * GRE
    * MPLS
    * IP-in-IP
    * IGMP
    * TCP
    * UDP
    * DHCP 
    * ICMP
    * ICMPv6
    * DNS & mDNS
    * HTTP
    * VXLAN
    * Geneve
    * TLS (Header type only)
    * QUIC (Header type only)

* Ability to search within and copy/paste from ouput.

* Ability to save as text to make sharing content easier.

* Ability to highlight or filter on packet types or endpoints.

* Maximum compatibility with PCAP and PCAPNG files, including those output by pktmon and wireshark, with graceful handling of unknown protocols.

![User opens a pcapng file named pktmon-dhcp.pcapng using the extension. The user then navigates the menus](https://github.com/CusanzaBros/vscode-net-tools/blob/main/demo.gif?raw=true)


## Requirements

This extension does not require any addition software, and works on Windows, Linux, and MacOS.

## Contributions

This project was written and is maintained by Zach Cusanza.
Please submit issues with this extension and feature requests to the [vscode-net-tools github repo](https://github.com/CusanzaBros/vscode-net-tools/issues).

Contributions are also welcome!

## Known Issues

* Selected packets are cleared when items in context menu are used.  To restore: clear selection in packet locator, then reselect desired item in the packet locator. 

## Release Notes

### 1.7.0

* Added new protocol parser
    * Generic Network Virtualization Encapsulation (Geneve)

### 1.6.0

* Added new protocol Parser
    * MPLS

### 1.5.1

* Improved TLS parser slightly
* Fixed bugs:
    * Packets with nested protocols failed to highlight or filter correctly when selected
    * Improved formatting of addresses in interface description block
    * Inconsistent formatting of ICMPv6 request and reply data

### 1.5.0

* Added new protocol parsers
    * GRE
    * IP-in-IP

### 1.4.2

* Added .cap to supported file extensions

### 1.4.1

* Completed PPPoE and added enough PPP for IP payloads

### 1.4.0

* Added minimap next to scrollbar

* Added interface list to packet locator

* Added support for systemd journal export block

* Added settings and context menu: Switch between timestamp or offset time, Hide or show MAC addresses, Hide or show comments 

* Added new protocol parsers
    * Raw IP (linktype 101)

* Fixed bugs:
    * Some timestamps incorrectly calculated
    * Options missing for interface description block and enhanced packet block in packet details

### 1.3.0

* Added icon to activity bar and relocated details and data to primary sidebar to make room for additional sections

* Improved formatting for packet details and packet bytes

* Added packet locator panel to sidebar for highlighting or filtering on a selected protocol or endpoint

* Improved coloring for users that have VSCode incorrectly configured to use a light theme

* Highlights byte data matching selected packet details

* Added new protocol parsers:
    * TLS (header identification only)
    * QUIC (header identification only)

* Fixed bugs:
    * Exception caused by truncated DNS packets 

### 1.2.0

* Updated icon

* Expanded on DNS implementation with more record types

* Optimized binary output for large files

* Added new protocol parsers:
    * PPPoE (discovery only)
    * IGMP versions 1-3
    * VXLAN

* Fixed bugs:
    * Exception handling on a per-line basis
    * Incorrect options offset for ICMPv6
    * Excess data in known protocols for IPv4 
    * Excess parenthesis in IPv6 output

### 1.1.0

* Implemented SLL2, 802.1Q VLAN, HTTP, PCAPNG Simple Packet Block

* Fixed bugs:
    * Incorrect packet length calculation when captured length < original length
    * PCAPNG packets not aligned to 4 byte boundary caused incorrect calculation
    * Handling of non-ethernet packets
    * Showing line-numbering for non-packet rows

* Added in-line comments



### 1.0.0

* Initial release of VSCode Network Tools