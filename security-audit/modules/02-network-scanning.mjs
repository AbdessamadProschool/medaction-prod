
import axios from 'axios';

export class NetworkScanningModule {
  constructor(config) {
    this.config = config;
    this.findings = [];
  }

  async scanCommonPorts() {
    console.log('  [02] Testing Network Ports...');
    const ports = [80, 443, 3000, 8080, 8443];
    const targetUrl = new URL(this.config.target);
    const hostname = targetUrl.hostname;
    const findings = [];

    // Simple HTTP connect check
    for(const port of ports) {
        try {
            const protocol = port === 443 || port === 8443 ? 'https' : 'http';
            const res = await axios.get(`${protocol}://${hostname}:${port}/`, { timeout: 2000, validateStatus: ()=>true });
            console.log(`    Port ${port} is OPEN (${res.status})`);
            
            if(port !== 80 && port !== 443 && port !== 3000) {
                 findings.push({
                    severity: 'LOW',
                    category: 'Network Security',
                    title: `Non-standard Port Open: ${port}`,
                    description: `Port ${port} is accessible publicly.`,
                    endpoint: `${hostname}:${port}`,
                    method: 'CONNECT',
                    remediation: 'Close unnecessary ports via firewall.',
                    cvss: 3.0
                });
            }
        } catch(e) {
            // Port closed or timeout
        }
    }
    return { findings };
  }
}
