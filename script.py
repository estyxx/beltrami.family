from gedcom.parser import Parser
import json
from pathlib import Path
from gedcom.element.individual import IndividualElement

# Path to the GEDCOM file
gedcom_file_path = Path("public/beltrami.ged")

# Function to extract element data
def extract_element_data(element):
    """Extract data from a GEDCOM element and its children."""
    (given_names, surname) = element.get_name()

    data = {
        'tag': element.get_tag(),
        "surname": surname,
        "given_names": given_names,
        "birth": element.get_birth_data(),
        "death": element.get_death_data(),
        'children': []
    }
    # for child in element.get_child_elements():
    #     if isinstance(element, IndividualElement):
    #         data['children'].append(extract_element_data(child))

    print(data)
    return data

# Parse the GEDCOM file
def parse_gedcom_file(file_path):
    """Parse GEDCOM file and return structured data."""
    gedcom_parser = Parser()
    gedcom_parser.parse_file(str(file_path), strict=False)

    # Traverse root elements
    root_elements = gedcom_parser.get_root_child_elements()
    parsed_data = []
    for element in root_elements:
        if isinstance(element, IndividualElement):
            parsed_data.append(extract_element_data(element))

    return parsed_data

# Extract data
gedcom_data = parse_gedcom_file(gedcom_file_path)

# Convert to JSON
gedcom_json = json.dumps(gedcom_data, indent=4)

# Save JSON to a file
output_json_path = Path("output.json")
output_json_path.write_text(gedcom_json)

# Display confirmation message
output_json_path
