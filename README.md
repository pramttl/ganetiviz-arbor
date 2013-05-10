# Client end code for visualising a Ganeti Cluster using HTML5, Javascript

The code makes use of the sample OSUOSL cluster configuration JSON and tries to 
create graphical visualisations for the cluster graph  made avaialbe by Ramereth, 
courtsey [OSUOSL](http://github.com/osuosl).
The initial goal of this is to experiment with Ganeti Cluster Visualization 
strategies and develop prototypes using HTML5 and Jacascript. 

The greater goal is to support the [Ganeti Web Manager](http://code.osuosl.org/projects/ganeti-webmgr) 
project at the [OSUOSL](http://osuosl.org). Visualisation of clusters in the 
form of intuitive graphical models and structures will help Cluster
 Administrators get more insights into their Cluster, Node and Virtual Machines
configuration and usage more easily.

# Requirements

The required Javascript Libraries are included in this project. A modern HTML5 
compatible web browser should be used.

* [jquery >= 1.6.1] (http://jquery.com/)
* [arbor.js >= 0.91] (http://arborjs.org/) 

A Web Server is required to run the code without any problems, since the code 
makes use of XML/JSON HTTP Requests.

# Setup

1. Download Code and deploy in web directory of any running web server 
like Apache, Nginx,etc.

2. Visit the directory location in the browser.

# Snapshots

![Unable to Load :(](http://webfuel.co.in/pranjal/test/images/ganetiviz_img1.png "Cluster with 5 nodes")

# Copyright

This work is licensed under a [Creative Commons Attribution-Share Alike 3.0
United States License](http://creativecommons.org/licenses/by-sa/3.0/us/).

vi: set tw=80 ft=markdown :
