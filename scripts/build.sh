#!/bin/bash
export GIT_SHA="TAG_FROM_CI"

# Generate yaml and add to products-dist
generate_yaml () {
  PRODUCT=$1
  export RELEASE_NAME=$PRODUCT
  yarn compile && yarn synth
  cat ./dist/$PRODUCT.k8s.yaml > ./products-dist/$PRODUCT-dist/$PRODUCT.k8s.yaml 
}

# Build for all products
generate_yaml courses
generate_yaml clubs
generate_yaml mobile
generate_yaml ohq