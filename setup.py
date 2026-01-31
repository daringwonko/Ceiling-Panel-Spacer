#!/usr/bin/env python3
"""
Setup script for Savage Cabinetry Platform
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="savage-cabinetry-platform",
    version="1.0.0",
    author="Savage Cabinetry Team",
    author_email="support@savagecabinetry.com",
    description="Professional kitchen design and ceiling panel calculation platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/savagecabinetry/platform",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: End Users/Desktop",
        "Topic :: Scientific/Engineering",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    keywords="kitchen design ceiling panels construction cad manufacturing",
    python_requires=">=3.8",
    install_requires=[
        "dataclasses; python_version < '3.7'",
        "typing; python_version < '3.5'",
        "pathlib; python_version < '3.4'",
    ],
    extras_require={
        "gui": ["flask", "werkzeug"],
        "cad": ["ezdxf"],
        "full": ["flask", "werkzeug", "ezdxf"],
    },
    entry_points={
        "console_scripts": [
            "savage-cli=savage_cli:main",
            "savage-platform=main_platform_entry:main",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)
