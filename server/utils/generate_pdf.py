import json
import sys
import pdfkit
from jinja2 import Environment, FileSystemLoader
from datetime import datetime

def generate_billing_pdf():
    # Get input data from command line argument
    data = json.loads(sys.argv[1])
    billing = data['billing']
    template_path = data['templatePath']
    output_path = data['outputPath']
    
    # Set up Jinja2 environment
    env = Environment(
        loader=FileSystemLoader(template_path.rsplit('/', 1)[0]),
        autoescape=True
    )
    template = env.get_template(template_path.rsplit('/', 1)[1])
    
    # Format dates
    billing['time'] = datetime.fromisoformat(billing['time']).strftime('%d.%m.%Y')
    due_date = datetime.fromisoformat(data['dueDate']).strftime('%d.%m.%Y')
    
    # Render HTML
    html = template.render(
        billing=billing['billing'],
        patient=billing['patient'],
        employee=billing['employee'],
        dueDate=due_date,
        serviceCategory=data['serviceCategory']
    )
    
    # Generate PDF
    options = {
        'page-size': 'A4',
        'margin-top': '20mm',
        'margin-right': '20mm',
        'margin-bottom': '20mm',
        'margin-left': '20mm',
        'encoding': 'UTF-8',
    }
    
    pdfkit.from_string(html, output_path, options=options)

if __name__ == '__main__':
    generate_billing_pdf()
